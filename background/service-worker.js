/**
 * X-Shield — Service Worker (Manifest V3)
 * Manages badge counts, statistics, context menus and settings synchronization.
 */

const DEFAULT_SETTINGS = {
  enabled: true,
  actionType: 'collapse', // 'collapse' (show shield banner with view option) or 'remove' (completely hidden)
  showBadgeCount: true,
  blockAdultSpamCards: true,
  blockMp4Links: true,

  // Malicious & Phishing Domains (pre-populated with user targets and common bot networks)
  blockedDomains: [
    'cdn.eunwo.com',
    'eunwo.com',
    'videy.rest',
    'cdn.videy.rest',
    'videy.co',
    'videy.tv',
    'aceimg.com',
    'aceimp.com',
    'up.aceimp.com',
    'acenmg.fun',
    'acenmg.com',
    'eciamg.com',
    'up.eciamg.com',
    'slicibrive.com',
    'cdn.slicibrive.com',
    'slicedrivee.site',
    'slicedrive.com',
    'slicedrivee.com',
    'tokopedia.com',
    'vt.tokopedia.com',
    'terabox.com',
    'teraboxapp.com',
    '1024tera.com',
    'terafileshare.com',
    'dropgalaxy.com',
    'dropgalaxy.co',
    'ouo.io',
    'linkvertise.com',
    'poophd.com',
    'streambucket.net',
    'shorturl.at',
    'tinyurl.is',
    'is.gd',
    'bit.ly/leak',
    't.me/joinchat'
  ],

  // Suspicious Bot Keywords / Phrases (observed in spam networks)
  blockedKeywords: [
    'Form Imgur con',
    'LEAK VIRAL VIDEO',
    'leak video',
    'part9',
    'part 2 full video in bio',
    'full video in bio',
    'full video link in comment',
    'leaked tape',
    'fuxvgio'
  ],

  // Whitelisted Domains (never flag)
  whitelistedDomains: [
    'x.com',
    'twitter.com',
    't.co',
    'youtube.com',
    'youtu.be',
    'github.com',
    'google.com',
    'wikipedia.org',
    'instagram.com',
    'twitch.tv'
  ],

  stats: {
    totalBlocked: 0,
    blockedToday: 0,
    lastDate: new Date().toISOString().slice(0, 10)
  },

  // Remote Community Blocklist (uBlock / EasyList style sync)
  filterListUrl: 'https://raw.githubusercontent.com/Barracuda1337/x-shield/main/filters/filters.json',
  lastFilterSync: null,
  filterVersion: '2026.10.25.1',
  autoSyncFilters: true
};

// Initialize settings on install or update, and migrate new domains into existing list
chrome.runtime.onInstalled.addListener(async (details) => {
  const current = await chrome.storage.local.get(null);
  const settings = { ...DEFAULT_SETTINGS, ...current };

  // Always merge default blocked domains so user automatically gets new protection rules
  const mergedDomains = new Set([...DEFAULT_SETTINGS.blockedDomains, ...(current.blockedDomains || [])]);
  settings.blockedDomains = Array.from(mergedDomains);

  if (!Array.isArray(settings.blockedKeywords)) settings.blockedKeywords = DEFAULT_SETTINGS.blockedKeywords;
  if (!Array.isArray(settings.whitelistedDomains)) settings.whitelistedDomains = DEFAULT_SETTINGS.whitelistedDomains;
  if (!settings.stats) settings.stats = DEFAULT_SETTINGS.stats;
  if (!settings.filterListUrl) settings.filterListUrl = DEFAULT_SETTINGS.filterListUrl;

  await chrome.storage.local.set(settings);

  // Setup periodic filter list sync (every 6 hours)
  try {
    chrome.alarms.create('SYNC_FILTERS_ALARM', { periodInMinutes: 360 });
    syncFiltersFromRemote(false);
  } catch (err) {
    console.warn('[X-Shield] Alarm creation notice:', err);
  }

  // Setup Context Menus
  try {
    await chrome.contextMenus.removeAll();
    chrome.contextMenus.create({
      id: 'xshield_add_domain',
      title: '🛡️ X-Shield: Seçili Alan Adını Kara Listeye Ekle',
      contexts: ['selection', 'link']
    });

    chrome.contextMenus.create({
      id: 'xshield_add_keyword',
      title: '🛡️ X-Shield: Seçili Metni Spam Kelimelerine Ekle',
      contexts: ['selection']
    });
  } catch (err) {
    console.error('[X-Shield] Context menu creation error:', err);
  }

  console.log('[X-Shield] Installed successfully with default protection lists.');
});

// Context Menu Action Handler
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const settings = await chrome.storage.local.get(['blockedDomains', 'blockedKeywords']);
  const domains = new Set(settings.blockedDomains || DEFAULT_SETTINGS.blockedDomains);
  const keywords = new Set(settings.blockedKeywords || DEFAULT_SETTINGS.blockedKeywords);

  if (info.menuItemId === 'xshield_add_domain') {
    let target = '';
    if (info.linkUrl) {
      try {
        const u = new URL(info.linkUrl);
        target = u.hostname.toLowerCase();
      } catch {
        target = info.linkUrl.trim().toLowerCase();
      }
    } else if (info.selectionText) {
      target = info.selectionText.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0];
    }

    if (target && target.length > 2) {
      domains.add(target);
      await chrome.storage.local.set({ blockedDomains: Array.from(domains) });
      notifyTab(tab?.id, `Alan adı engellendi: ${target}`);
    }
  } else if (info.menuItemId === 'xshield_add_keyword' && info.selectionText) {
    const kw = info.selectionText.trim();
    if (kw.length >= 2) {
      keywords.add(kw);
      await chrome.storage.local.set({ blockedKeywords: Array.from(keywords) });
      notifyTab(tab?.id, `Kelime filtresine eklendi: "${kw}"`);
    }
  }
});

// Handle Keyboard Shortcuts
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-shield') {
    const { enabled = true } = await chrome.storage.local.get('enabled');
    const newState = !enabled;
    await chrome.storage.local.set({ enabled: newState });

    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (activeTab?.id) {
      chrome.tabs.sendMessage(activeTab.id, { type: 'SETTINGS_CHANGED', settings: { enabled: newState } }).catch(() => {});
      updateBadge(activeTab.id, newState ? '' : 'OFF', newState ? '#EF4444' : '#64748B');
    }
  }
});

// Handle Messages from Content Script or Popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'THREAT_BLOCKED') {
    handleThreatBlocked(sender.tab?.id, message.count, message.domain, message.reason);
    sendResponse({ ok: true });
    return true;
  }

  if (message.type === 'GET_TAB_BADGE') {
    const tabId = message.tabId || sender.tab?.id;
    (async () => {
      const badge = await chrome.action.getBadgeText({ tabId });
      sendResponse({ count: parseInt(badge || '0', 10) || 0 });
    })();
    return true;
  }

  if (message.type === 'UPDATE_SETTINGS') {
    (async () => {
      await chrome.storage.local.set(message.settings);
      // Broadcast to all tabs
      const tabs = await chrome.tabs.query({});
      for (const t of tabs) {
        if (t.id) {
          chrome.tabs.sendMessage(t.id, { type: 'SETTINGS_CHANGED', settings: message.settings }).catch(() => {});
        }
      }
      sendResponse({ ok: true });
    })();
    return true;
  }

  if (message.type === 'RESET_TAB_COUNT') {
    if (sender.tab?.id) {
      chrome.action.setBadgeText({ tabId: sender.tab.id, text: '' });
    }
    sendResponse({ ok: true });
    return true;
  }

  if (message.type === 'SYNC_FILTERS_NOW') {
    (async () => {
      const res = await syncFiltersFromRemote(true);
      sendResponse(res);
    })();
    return true;
  }
});

// Alarm Listener for Periodic Sync
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'SYNC_FILTERS_ALARM') {
    await syncFiltersFromRemote(false);
  }
});

/**
 * Fetch and synchronize remote community filters (uBlock / EasyList style)
 */
async function syncFiltersFromRemote(isManual = false) {
  try {
    const { filterListUrl, blockedDomains = [], blockedKeywords = [], whitelistedDomains = [] } = await chrome.storage.local.get([
      'filterListUrl', 'blockedDomains', 'blockedKeywords', 'whitelistedDomains'
    ]);
    const targetUrl = filterListUrl || DEFAULT_SETTINGS.filterListUrl;

    console.log('[X-Shield] Syncing filters from:', targetUrl);
    const res = await fetch(targetUrl, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    if (!data || (!Array.isArray(data.blockedDomains) && !Array.isArray(data.blockedKeywords))) {
      throw new Error('Invalid filter format');
    }

    const mergedDomains = Array.from(new Set([...(data.blockedDomains || []), ...blockedDomains]));
    const mergedKeywords = Array.from(new Set([...(data.blockedKeywords || []), ...blockedKeywords]));
    const mergedWhitelist = Array.from(new Set([...(data.whitelistedDomains || []), ...whitelistedDomains]));

    const now = Date.now();
    await chrome.storage.local.set({
      blockedDomains: mergedDomains,
      blockedKeywords: mergedKeywords,
      whitelistedDomains: mergedWhitelist,
      lastFilterSync: now,
      filterVersion: data.version || new Date().toISOString().slice(0, 10)
    });

    // Broadcast to open tabs
    const tabs = await chrome.tabs.query({});
    for (const t of tabs) {
      if (t.id) {
        chrome.tabs.sendMessage(t.id, {
          type: 'SETTINGS_CHANGED',
          settings: {
            blockedDomains: mergedDomains,
            blockedKeywords: mergedKeywords,
            whitelistedDomains: mergedWhitelist
          }
        }).catch(() => {});
      }
    }

    console.log(`[X-Shield] Filter sync success: ${mergedDomains.length} domains, ${mergedKeywords.length} keywords.`);
    return {
      success: true,
      domainCount: mergedDomains.length,
      keywordCount: mergedKeywords.length,
      version: data.version,
      lastSync: now
    };
  } catch (err) {
    console.warn('[X-Shield] Remote filter sync failed (offline or repo initializing):', err.message);
    return {
      success: false,
      error: err.message
    };
  }
}

/**
 * Handle a detected threat: update badge and global stats
 */
async function handleThreatBlocked(tabId, count, domain, reason) {
  if (!tabId) return;

  const { enabled = true, showBadgeCount = true, stats = DEFAULT_SETTINGS.stats } = await chrome.storage.local.get(['enabled', 'showBadgeCount', 'stats']);

  if (enabled && showBadgeCount) {
    const text = count > 0 ? String(count) : '';
    await chrome.action.setBadgeText({ tabId, text });
    await chrome.action.setBadgeBackgroundColor({ tabId, color: '#EF4444' }); // Crimson danger badge
  }

  // Update cumulative statistics
  const today = new Date().toISOString().slice(0, 10);
  let blockedToday = stats.blockedToday || 0;
  if (stats.lastDate !== today) {
    blockedToday = 0;
  }

  const updatedStats = {
    totalBlocked: (stats.totalBlocked || 0) + 1,
    blockedToday: blockedToday + 1,
    lastDate: today
  };

  await chrome.storage.local.set({ stats: updatedStats });
}

function updateBadge(tabId, text, color) {
  if (!tabId) return;
  chrome.action.setBadgeText({ tabId, text });
  if (color) {
    chrome.action.setBadgeBackgroundColor({ tabId, color });
  }
}

function notifyTab(tabId, message) {
  if (!tabId) return;
  chrome.tabs.sendMessage(tabId, { type: 'SHOW_TOAST', message }).catch(() => {});
}
