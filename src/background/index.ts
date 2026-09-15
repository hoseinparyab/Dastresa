/**
 * Dastresa MV3 service worker — lean coordinator only.
 */

import {
  GEMINI_API,
  LUMA_API,
  ONBOARDING_VERSION,
  STORAGE_KEYS,
} from '@/core/constants';
import { parseSettings } from '@/core/settings';
import type { OnboardingState } from '@/features/onboarding/onboarding-storage';
import {
  summarizeViaBackend,
  summarizeWithGemini,
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
    sendResponse({ ok: true, version: '1.0.0' });
    return true;
  }
  if (message?.type === 'dastresa-summarize') {
    void (async () => {
      try {
        const secrets = await readSecrets();
        const stored = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
        const settings = parseSettings(stored[STORAGE_KEYS.SETTINGS]);
        const title = String(message.title ?? '');
        const text = String(message.text ?? '');
        const locale = message.locale === 'en' ? 'en' : 'fa';
        const provider = settings.summaryProvider;

        let summary: string;
        if (provider === 'luma') {
          const lumaKey = secrets.lumaApiKey?.trim();
          if (!lumaKey) {
            sendResponse({ ok: false, code: 'missing_api_key', error: 'missing_api_key' });
            return;
          }
          summary = await summarizeWithLuma({
            apiKey: lumaKey,
            model: settings.summaryModel || LUMA_API.DEFAULT_MODEL,
            title,
            text,
            locale,
          });
        } else if (provider === 'gemini') {
          const geminiKey = secrets.geminiApiKey?.trim();
          if (!geminiKey) {
            sendResponse({ ok: false, code: 'missing_api_key', error: 'missing_api_key' });
            return;
          }
          summary = await summarizeWithGemini({
            apiKey: geminiKey,
            model: settings.summaryModel || GEMINI_API.DEFAULT_MODEL,
            title,
            text,
            locale,
          });
        } else {
          // Free tier → Dastresa-API-Core per docs.json
          summary = await summarizeViaBackend({
            title,
            text,
            locale,
          });
        }

        sendResponse({ ok: true, summary });
      } catch (error) {
        const errMessage = error instanceof Error ? error.message : 'summary_failed';
        const isOffline =
          /failed to fetch|networkerror|load failed|could not connect/i.test(errMessage);
        const known = [
          'missing_api_key',
          'rate_limited',
          'text_too_short',
          'server_misconfigured',
          'invalid_json',
          'summary_failed',
        ] as const;
        const code = isOffline
          ? 'offline'
          : (known.find((k) => k === errMessage) ?? 'api_error');
        sendResponse({
          ok: false,
          code,
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
