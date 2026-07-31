import type { ContentRuntime } from '@/content/lifecycle';
import {
  applySettingsFromMessage,
  handleActivate,
  handleExit,
  handleReset,
} from '@/content/lifecycle';

/** Chrome runtime message bridge for popup / options → content. */
export function registerContentMessageHandlers(runtime: ContentRuntime): void {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === 'dastresa-exit') {
      void handleExit(runtime).then(() => sendResponse({ ok: true }));
      return true;
    }
    if (message?.type === 'dastresa-activate') {
      void handleActivate(runtime).then(() => sendResponse({ ok: true }));
      return true;
    }
    if (message?.type === 'dastresa-reset') {
      void handleReset(runtime).then(() => sendResponse({ ok: true }));
      return true;
    }
    if (message?.type === 'dastresa-apply-settings') {
      void (async () => {
        const ok = await applySettingsFromMessage(runtime, message.settings);
        sendResponse({ ok });
      })();
      return true;
    }
    return false;
  });
}
