/**
 * X-Shield — Content Script (Manifest V3)
 * Real-time scanning & blocking of phishing, malicious .mp4 and bot replies on X (Twitter).
 */

(function () {
  'use strict';

  // Prevent multiple injections
  if (window.__xShieldInjected) return;
  window.__xShieldInjected = true;

  let currentSettings = {
    enabled: true,
    actionType: 'collapse',
    showBadgeCount: true,
    blockAdultSpamCards: true,
    blockMp4Links: true,
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
      'is.gd'
    ],
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
    ]
  };

  let tabThreatCount = 0;
  let isScanning = false;
  let lastUrl = location.href;

  // Initialize: Load settings from storage and merge new default rules
  chrome.storage.local.get(null, (saved) => {
    if (saved && typeof saved.enabled !== 'undefined') {
      const mergedDomains = Array.from(new Set([...currentSettings.blockedDomains, ...(saved.blockedDomains || [])]));
      currentSettings = { ...currentSettings, ...saved, blockedDomains: mergedDomains };
    }
    // Initial scan after settings load
    scheduleScan();
  });

  // Listen for real-time setting updates or toasts from background
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SETTINGS_CHANGED') {
      currentSettings = { ...currentSettings, ...message.settings };
      // Re-evaluate existing tweets
      refreshAllTweets();
      sendResponse({ ok: true });
    } else if (message.type === 'SHOW_TOAST') {
      showToast(message.message);
      sendResponse({ ok: true });
    }
    return true;
  });

  /**
   * Schedule a scan on next animation frame
   */
  function scheduleScan() {
    if (isScanning || !currentSettings.enabled) return;
    isScanning = true;
    requestAnimationFrame(() => {
      scanPage();
      isScanning = false;
    });
  }

  /**
   * Scan all tweet elements on the page
   */
  function scanPage() {
    if (!currentSettings.enabled) return;

    // Support both standard X articles and test fixtures
    const tweetElements = document.querySelectorAll('article[data-testid="tweet"], article[role="article"], .xshield-target-tweet');
    for (const tweet of tweetElements) {
      processTweet(tweet);
    }
  }

  /**
   * Evaluate and process an individual tweet element
   */
  function processTweet(tweet) {
    if (!tweet || !tweet.isConnected) return;

    // Check if user disabled shield
    if (!currentSettings.enabled) {
      unblockTweet(tweet);
      return;
    }

    const threat = evaluateTweet(tweet);

    if (threat) {
      // Threat detected!
      const alreadyBlocked = tweet.getAttribute('data-xshield-blocked') === 'true';
      tweet.setAttribute('data-xshield-blocked', 'true');
      tweet.setAttribute('data-xshield-threat-type', threat.type);
      tweet.setAttribute('data-xshield-threat-value', threat.value);

      if (!alreadyBlocked) {
        tabThreatCount++;
        chrome.runtime.sendMessage({
          type: 'THREAT_BLOCKED',
          count: tabThreatCount,
          domain: threat.value,
          reason: threat.label
        }).catch(() => {});
      }

      applyBlockingUI(tweet, threat);
    } else {
      // Clean tweet
      if (tweet.getAttribute('data-xshield-blocked') === 'true') {
        unblockTweet(tweet);
      }
    }
  }

  /**
   * Threat Evaluation Logic
   */
  function evaluateTweet(tweet) {
    const fullText = (tweet.innerText || '').trim();
    const fullTextLower = fullText.toLowerCase();

    // 1. Check Whitelist
    for (const whiteDomain of currentSettings.whitelistedDomains || []) {
      const wd = whiteDomain.toLowerCase();
      // If the tweet is an official tweet from a whitelisted authority and doesn't contain blacklisted domains, leave intact
    }

    // 2. Extract Links and Display Link Texts
    const links = tweet.querySelectorAll('a[href]');
    const foundUrls = [];

    links.forEach(a => {
      const href = a.getAttribute('href') || '';
      const text = (a.innerText || '').trim();
      const title = a.getAttribute('title') || '';
      foundUrls.push(href.toLowerCase());
      foundUrls.push(text.toLowerCase());
      if (title) foundUrls.push(title.toLowerCase());
    });

    // 3. Domain Blacklist Check
    const blockedDomains = currentSettings.blockedDomains || [];
    for (const domain of blockedDomains) {
      const d = domain.trim().toLowerCase();
      if (!d) continue;

      // Check in links
      for (const u of foundUrls) {
        if (u.includes(d)) {
          return {
            type: 'domain',
            value: domain,
            label: `Zararlı Alan Adı: ${domain}`
          };
        }
      }

      // Check in tweet text or card text (e.g. "Kaynak: cdn.eunwo.com")
      if (fullTextLower.includes(d)) {
        return {
          type: 'domain',
          value: domain,
          label: `Şüpheli Kaynak: ${domain}`
        };
      }
    }

    // 3b. Fake / Impersonated twimg Typosquatting Check
    // Malicious bots register fake domains like media.twimg.net.im, twimg.co.in, twimg.im, twimg.date
    const fakeTwimgRegex = /(?:https?:\/\/)?([a-z0-9.-]*twimg[a-z0-9.-]*\.[a-z]{2,})/gi;
    let twMatch;
    while ((twMatch = fakeTwimgRegex.exec(fullTextLower)) !== null) {
      const host = twMatch[1].toLowerCase();
      if (!host.endsWith('.twimg.com') && host !== 'twimg.com') {
        return {
          type: 'typosquatting',
          value: host,
          label: `Sahte Twitter CDN Taklidi: ${host}`
        };
      }
    }

    // 3c. Bot Upload / File Trap Endpoints (e.g. aceimg.com/upload?f=..., cdn.slicibrive.com/d?f=..., etc.)
    const botTrapRegex = /(?:https?:\/\/)?([a-z0-9.-]*(?:aceimg|aceimp|acenmg|eciamg|slicibrive|slicedrivee?|videy|tokopedia)[a-z0-9.-]*\.[a-z]{2,}(?:\/[^\s"'<>]*)?)/gi;
    const botTrapMatch = fullTextLower.match(botTrapRegex);
    if (botTrapMatch) {
      return {
        type: 'bot_trap',
        value: botTrapMatch[0],
        label: `Zararlı Bot Linki: ${botTrapMatch[0]}`
      };
    }

    // 4. Raw external media link check (.mp4 / .mov spam)
    if (currentSettings.blockMp4Links) {
      // Matches things like cdn.videy.rest/zPfc0r.mp4 or http.../xyz.mp4
      const mp4Regex = /(https?:\/\/[^\s"'<>]+\.(?:mp4|mov|avi|mkv)(?:\?[^\s"'<>]*)?|[a-z0-9.-]+\/[a-z0-9._-]+\.mp4)/i;
      const match = fullText.match(mp4Regex);
      if (match) {
        const found = match[0];
        // Ensure it's not a native twitter media link
        if (!found.includes('video.twimg.com') && !found.includes('twitter.com') && !found.includes('x.com')) {
          return {
            type: 'mp4_link',
            value: found,
            label: `Sahte .mp4 Video Linki: ${found}`
          };
        }
      }
    }

    // 5. Keyword & Bot Phrase Filter
    const blockedKeywords = currentSettings.blockedKeywords || [];
    for (const kw of blockedKeywords) {
      const k = kw.trim();
      if (!k) continue;

      // Case-insensitive phrase match
      if (fullTextLower.includes(k.toLowerCase())) {
        return {
          type: 'keyword',
          value: kw,
          label: `Spam İfadesi: "${kw}"`
        };
      }
    }

    // 6. Adult Content Warning Cards with spam previews
    if (currentSettings.blockAdultSpamCards) {
      // Check for twitter adult content warning element
      if (fullTextLower.includes('content warning: adult content') || fullTextLower.includes('x labeled this post as containing adult content')) {
        // If it also contains 'leak' or an external link
        if (fullTextLower.includes('leak') || fullTextLower.includes('cdn.') || fullTextLower.includes('part') || fullTextLower.includes('.mp4')) {
          return {
            type: 'adult_spam_card',
            value: 'Adult Content Spam Card',
            label: 'Yetişkin Uyarılı Spam Botu'
          };
        }
      }
    }

    return null;
  }

  /**
   * Apply UI modification (Collapse or Remove)
   */
  function applyBlockingUI(tweet, threat) {
    if (currentSettings.actionType === 'remove') {
      tweet.classList.remove('xshield-collapsed', 'xshield-revealed');
      tweet.classList.add('xshield-removed');
      return;
    }

    // Default: 'collapse' mode
    tweet.classList.remove('xshield-removed');
    tweet.classList.add('xshield-collapsed');

    // Create or update the collapsed banner
    let banner = tweet.querySelector(':scope > .xshield-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.className = 'xshield-banner';
      tweet.prepend(banner);
    }

    const domainDisplay = escapeHtml(threat.value);
    const labelDisplay = escapeHtml(threat.label);

    banner.innerHTML = `
      <div class="xshield-banner-info">
        <span class="xshield-tag-shield">🛡️ X-Shield</span>
        <span class="xshield-tag-alert">Şüpheli Yanıt Engellendi</span>
        <span class="xshield-threat-domain" title="${labelDisplay}">${domainDisplay}</span>
      </div>
      <div class="xshield-banner-actions">
        <button type="button" class="xshield-btn xshield-btn-toggle" title="Yanıtı geçici olarak incele">İncele / Göster</button>
      </div>
    `;

    // Toggle button handler
    const toggleBtn = banner.querySelector('.xshield-btn-toggle');
    if (toggleBtn) {
      toggleBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const isRevealed = tweet.classList.toggle('xshield-revealed');
        toggleBtn.textContent = isRevealed ? 'Tekrar Gizle' : 'İncele / Göster';
      };
    }
  }

  /**
   * Restore a tweet back to clean state
   */
  function unblockTweet(tweet) {
    tweet.removeAttribute('data-xshield-blocked');
    tweet.removeAttribute('data-xshield-threat-type');
    tweet.removeAttribute('data-xshield-threat-value');
    tweet.classList.remove('xshield-removed', 'xshield-collapsed', 'xshield-revealed');
    const banner = tweet.querySelector(':scope > .xshield-banner');
    if (banner) banner.remove();
  }

  /**
   * Force re-evaluating all tweets on settings change
   */
  function refreshAllTweets() {
    const tweets = document.querySelectorAll('article[data-testid="tweet"], article[role="article"], .xshield-target-tweet');
    tweets.forEach(processTweet);
  }

  /**
   * MutationObserver for dynamic infinite scroll feed
   */
  const observer = new MutationObserver((mutations) => {
    let shouldScan = false;
    for (const m of mutations) {
      if (m.addedNodes.length > 0) {
        shouldScan = true;
        break;
      }
    }
    if (shouldScan) {
      scheduleScan();
    }
  });

  // Start observing DOM changes
  function startObserver() {
    const target = document.body || document.documentElement;
    if (target) {
      observer.observe(target, {
        childList: true,
        subtree: true
      });
      scheduleScan();
    } else {
      setTimeout(startObserver, 50);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startObserver);
  } else {
    startObserver();
  }

  // SPA navigation detection (URL changes without page reload)
  setInterval(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      tabThreatCount = 0;
      chrome.runtime.sendMessage({ type: 'RESET_TAB_COUNT' }).catch(() => {});
      scheduleScan();
    }
  }, 800);

  /**
   * In-Page Toast Helper
   */
  function showToast(text) {
    const existing = document.querySelector('.xshield-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'xshield-toast';
    toast.innerHTML = `<span>🛡️</span><span>${escapeHtml(text)}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(15px)';
      setTimeout(() => toast.remove(), 350);
    }, 3200);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
})();
