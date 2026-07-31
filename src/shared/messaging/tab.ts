import type { DastresaSettings } from '@/core/settings';

export type ContentMessageType =
  | 'dastresa-exit'
  | 'dastresa-activate'
  | 'dastresa-reset'
  | 'dastresa-apply-settings';

/** Notify the active tab's content script; no-op on restricted pages. */
export async function notifyActiveTab(
  type: ContentMessageType,
  payload?: { settings?: DastresaSettings } & Record<string, unknown>,
): Promise<void> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;
    await chrome.tabs.sendMessage(tab.id, { type, ...payload });
  } catch {
    // Content script may be missing on chrome:// and other restricted pages.
  }
}
