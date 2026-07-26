/**
 * Dastresa MV3 service worker — lean coordinator only.
 */

import { ONBOARDING_VERSION, STORAGE_KEYS } from '@/core/constants';
import type { OnboardingState } from '@/features/onboarding/onboarding-storage';

async function seedOnboardingOnInstall(): Promise<void> {
  const initial: OnboardingState = {
    completed: false,
    version: ONBOARDING_VERSION,
  };
  await chrome.storage.local.set({ [STORAGE_KEYS.ONBOARDING]: initial });
  await chrome.tabs.create({
    url: chrome.runtime.getURL('src/onboarding/index.html'),
  });
}

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    void seedOnboardingOnInstall();
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'open-options') {
    void chrome.runtime.openOptionsPage();
    sendResponse({ ok: true });
    return true;
  }
  if (message?.type === 'open-onboarding') {
    void chrome.tabs.create({
      url: chrome.runtime.getURL('src/onboarding/index.html'),
    });
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
