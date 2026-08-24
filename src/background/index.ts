/**
 * Dastresa MV3 service worker — lean coordinator only.
 */

import { LUMA_API, ONBOARDING_VERSION, STORAGE_KEYS } from '@/core/constants';
import { parseSettings } from '@/core/settings';
import type { OnboardingState } from '@/features/onboarding/onboarding-storage';
import { summarizeWithLuma } from '@/features/page-summary/luma-client';
import { readSecrets } from '@/features/storage/secrets';

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
    sendResponse({ ok: true, version: '0.1.1' });
    return true;
  }
  if (message?.type === 'dastresa-summarize') {
    void (async () => {
      try {
        const secrets = await readSecrets();
        const apiKey =
          secrets.lumaApiKey?.trim() || LUMA_API.DEFAULT_API_KEY.trim();
        if (!apiKey) {
          sendResponse({ ok: false, code: 'missing_api_key', error: 'missing_api_key' });
          return;
        }

        const stored = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
        const settings = parseSettings(stored[STORAGE_KEYS.SETTINGS]);
        const summary = await summarizeWithLuma({
          apiKey,
          model: settings.summaryModel || LUMA_API.DEFAULT_MODEL,
          title: String(message.title ?? ''),
          text: String(message.text ?? ''),
          locale: message.locale === 'en' ? 'en' : 'fa',
        });
        sendResponse({ ok: true, summary });
      } catch (error) {
        const errMessage = error instanceof Error ? error.message : 'summary_failed';
        sendResponse({
          ok: false,
          code: errMessage === 'missing_api_key' ? 'missing_api_key' : 'api_error',
          error: errMessage,
        });
      }
    })();
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
