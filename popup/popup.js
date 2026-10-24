/**
 * X-Shield — Popup Controller (Matching SEO Lens Architecture & UX)
 *
 * Controls real-time protection, preferences, stats and blacklist management.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Elements
  const btnToggleShield = document.getElementById('btn-toggle-shield');
  const btnShieldText = document.getElementById('btn-shield-text');
  const statusDot = document.getElementById('status-dot');
  const statusLabel = document.getElementById('status-label');

  const statTab = document.getElementById('stat-tab');
  const statTotal = document.getElementById('stat-total');

  const modeCollapse = document.getElementById('mode-collapse');
  const modeRemove = document.getElementById('mode-remove');

  const settingMp4 = document.getElementById('setting-mp4');
  const settingAdult = document.getElementById('setting-adult');
  const settingBadge = document.getElementById('setting-badge');

  const domainCount = document.getElementById('domain-count');
  const domainList = document.getElementById('domain-list');
  const inputNewDomain = document.getElementById('input-new-domain');
  const btnAddDomain = document.getElementById('btn-add-domain');

  let currentSettings = await chrome.storage.local.get(null);

  // Initialize UI
  initUI(currentSettings);

  // Query Active Tab for Threats count
  try {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (activeTab?.id) {
      const badge = await chrome.action.getBadgeText({ tabId: activeTab.id });
      statTab.textContent = badge || '0';
    }
  } catch (err) {
    console.warn('Could not query active tab badge:', err);
  }

  function initUI(s) {
    const isEnabled = s.enabled !== false;
    updateStatusVisuals(isEnabled);

    statTotal.textContent = s.stats?.totalBlocked || 0;

    // Action Mode
    const mode = s.actionType || 'collapse';
    modeCollapse.classList.toggle('active', mode === 'collapse');
    modeRemove.classList.toggle('active', mode === 'remove');

    // Settings
    settingMp4.checked = s.blockMp4Links !== false;
    settingAdult.checked = s.blockAdultSpamCards !== false;
    settingBadge.checked = s.showBadgeCount !== false;

    // Filter sync version
    const filterVersionEl = document.getElementById('filter-version');
    if (filterVersionEl) filterVersionEl.textContent = s.filterVersion ? `v${s.filterVersion}` : 'v2026.10.25';

    const lastSyncLabel = document.getElementById('last-sync-label');
    if (lastSyncLabel && s.lastFilterSync) {
      const mins = Math.max(0, Math.floor((Date.now() - s.lastFilterSync) / 60000));
      lastSyncLabel.textContent = mins < 2 ? 'Az önce' : `${mins} dk önce`;
    }

    // Blacklist
    renderDomainList(s.blockedDomains || []);
  }

  function updateStatusVisuals(enabled) {
    if (enabled) {
      statusDot.classList.remove('disabled');
      statusLabel.textContent = 'Korumada';
      btnShieldText.textContent = 'Korumayı Durdur';
      btnToggleShield.classList.remove('disabled-btn');
    } else {
      statusDot.classList.add('disabled');
      statusLabel.textContent = 'Durduruldu';
      btnShieldText.textContent = 'Korumayı Başlat';
      btnToggleShield.classList.add('disabled-btn');
    }
  }

  // Toggle Button Click
  btnToggleShield.addEventListener('click', async () => {
    const newState = !(currentSettings.enabled !== false);
    currentSettings.enabled = newState;
    updateStatusVisuals(newState);
    await saveAndBroadcast({ enabled: newState });
    showToast(newState ? 'Kalkan devrede' : 'Kalkan durduruldu');
  });

  // Mode Selection
  modeCollapse.addEventListener('click', async () => {
    modeCollapse.classList.add('active');
    modeRemove.classList.remove('active');
    currentSettings.actionType = 'collapse';
    await saveAndBroadcast({ actionType: 'collapse' });
    showToast('Mod: Daralt & İncele');
  });

  modeRemove.addEventListener('click', async () => {
    modeRemove.classList.add('active');
    modeCollapse.classList.remove('active');
    currentSettings.actionType = 'remove';
    await saveAndBroadcast({ actionType: 'remove' });
    showToast('Mod: Görünmez Mod (Tamamen Gizle)');
  });

  // Checkbox listeners
  settingMp4.addEventListener('change', async () => {
    currentSettings.blockMp4Links = settingMp4.checked;
    await saveAndBroadcast({ blockMp4Links: settingMp4.checked });
  });

  settingAdult.addEventListener('change', async () => {
    currentSettings.blockAdultSpamCards = settingAdult.checked;
    await saveAndBroadcast({ blockAdultSpamCards: settingAdult.checked });
  });

  settingBadge.addEventListener('change', async () => {
    currentSettings.showBadgeCount = settingBadge.checked;
    await saveAndBroadcast({ showBadgeCount: settingBadge.checked });
  });

  // Blacklist Renderer (Matching SEO Lens Crypto Row Design)
  function renderDomainList(domains) {
    domainCount.textContent = domains.length;
    domainList.innerHTML = '';

    if (!domains || domains.length === 0) {
      domainList.innerHTML = '<div style="color: #71717a; font-size: 11px; padding: 6px 0;">Kayıtlı alan adı yok.</div>';
      return;
    }

    domains.forEach(domain => {
      const row = document.createElement('div');
      row.className = 'crypto-row';
      row.innerHTML = `
        <span class="crypto-tag tag-domain">BLOCK</span>
        <span class="crypto-addr" title="${escapeHtml(domain)}">${escapeHtml(domain)}</span>
        <button type="button" class="crypto-del-btn" title="Sil">✕</button>
      `;

      row.querySelector('.crypto-del-btn').addEventListener('click', async (e) => {
        e.stopPropagation();
        currentSettings.blockedDomains = currentSettings.blockedDomains.filter(d => d !== domain);
        await saveAndBroadcast({ blockedDomains: currentSettings.blockedDomains });
        renderDomainList(currentSettings.blockedDomains);
        showToast(`Silindi: ${domain}`);
      });

      domainList.appendChild(row);
    });
  }

  // Add Domain
  async function handleAddDomain() {
    let val = inputNewDomain.value.trim().toLowerCase();
    if (!val) return;
    val = val.replace(/^https?:\/\//, '').split('/')[0];

    const list = currentSettings.blockedDomains || [];
    if (list.includes(val)) {
      showToast('Zaten listede var');
      return;
    }

    list.unshift(val);
    currentSettings.blockedDomains = list;
    inputNewDomain.value = '';
    await saveAndBroadcast({ blockedDomains: list });
    renderDomainList(list);
    showToast(`Eklendi: ${val}`);
  }

  btnAddDomain.addEventListener('click', handleAddDomain);
  inputNewDomain.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleAddDomain();
  });

  // Cloud Filter Sync Button (uBlock style)
  const btnSyncFilters = document.getElementById('btn-sync-filters');
  const btnSyncText = document.getElementById('btn-sync-text');
  const lastSyncLabel = document.getElementById('last-sync-label');
  const filterVersionEl = document.getElementById('filter-version');

  if (btnSyncFilters) {
    btnSyncFilters.addEventListener('click', async () => {
      btnSyncText.textContent = '⏳ İndiriliyor...';
      btnSyncFilters.style.opacity = '0.7';

      try {
        const res = await chrome.runtime.sendMessage({ type: 'SYNC_FILTERS_NOW' });
        if (res && res.success) {
          if (filterVersionEl && res.version) filterVersionEl.textContent = `v${res.version}`;
          if (lastSyncLabel) lastSyncLabel.textContent = 'Az önce';
          showToast(`Topluluk listesi güncellendi! (${res.domainCount} kural)`);
          currentSettings = await chrome.storage.local.get(null);
          renderDomainList(currentSettings.blockedDomains || []);
        } else {
          showToast('Yerel liste devrede (Repo hazırlanıyor)');
        }
      } catch (err) {
        showToast('Bağlantı hatası, yerel kurallar aktif');
      } finally {
        btnSyncText.textContent = '🔄 Filtreleri Şimdi Güncelle';
        btnSyncFilters.style.opacity = '1';
      }
    });
  }

  // Crypto Address Copy Handlers (Identical to SEO Lens)
  document.querySelectorAll('.crypto-row[data-copy]').forEach(row => {
    row.addEventListener('click', () => {
      const addr = row.dataset.copy;
      if (addr) {
        navigator.clipboard.writeText(addr);
        showToast('Address copied!');
      }
    });
  });

  // Toast Helper
  function showToast(msg) {
    const toast = document.getElementById('copy-toast');
    if (toast) {
      toast.textContent = msg;
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
      }, 1600);
    }
  }

  async function saveAndBroadcast(updatedSlice) {
    await chrome.storage.local.set(updatedSlice);
    chrome.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      settings: updatedSlice
    }).catch(() => {});
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[m]);
  }
});
