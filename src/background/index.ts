/**
 * Dastresa MV3 service worker — lean coordinator only.
 */

import { LUMA_API, ONBOARDING_VERSION, STORAGE_KEYS, SUMMARY_API } from '@/core/constants';
import { parseSettings } from '@/core/settings';
import type { OnboardingState } from '@/features/onboarding/onboarding-storage';
import {
  summarizeViaBackend,
  summarizeWithLuma,
} from '@/features/page-summary/luma-client';
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
        const lumaKey = secrets.summaryApiKey?.trim();
        const stored = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
        const settings = parseSettings(stored[STORAGE_KEYS.SETTINGS]);
        const title = String(message.title ?? '');
        const text = String(message.text ?? '');
        const locale = message.locale === 'en' ? 'en' : 'fa';

        // Own Luma key → bypass free daily quota. Otherwise → free backend.
        const summary = lumaKey
          ? await summarizeWithLuma({
              apiKey: lumaKey,
              model: settings.summaryModel || LUMA_API.DEFAULT_MODEL,
              title,
              text,
              locale,
            })
          : await summarizeViaBackend({
              baseUrl: SUMMARY_API.BASE_URL,
              title,
              text,
              locale,
            });

        sendResponse({ ok: true, summary });
      } catch (error) {
        const errMessage = error instanceof Error ? error.message : 'summary_failed';
        const isOffline =
          /failed to fetch|networkerror|load failed|could not connect/i.test(errMessage);
        sendResponse({
          ok: false,
          code: isOffline
            ? 'offline'
            : errMessage === 'missing_api_key'
              ? 'missing_api_key'
              : errMessage === 'rate_limited'
                ? 'rate_limited'
                : 'api_error',
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
  if (changes['Dastresa.settings']) {
    // no-op: local watchers hydrate features
  }
});
