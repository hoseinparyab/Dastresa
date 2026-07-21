/**
 * Dastresa MV3 service worker — lean coordinator only.
 */

chrome.runtime.onInstalled.addListener(() => {
  // Reserved for future migrations; no network, no analytics.
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'open-options') {
    void chrome.runtime.openOptionsPage();
    sendResponse({ ok: true });
    return true;
  }
  if (message?.type === 'ping') {
    sendResponse({ ok: true, version: '0.1.0' });
    return true;
  }
  return false;
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  // Content scripts watch storage directly; SW keeps a heartbeat for debugging.
  if (changes['Dastresa.settings']) {
    // no-op: local watchers hydrate features
  }
});
