import type { DastresaSettings } from '@/core/settings';

export type ContentMessageType =
  | 'dastresa-exit'
  | 'dastresa-activate'
  | 'dastresa-reset'
  | 'dastresa-apply-settings';

async function resolveTargetTabId(): Promise<number | undefined> {
  try {
    const [active] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (active?.id != null) return active.id;
  } catch {
    // ignore
  }
  try {
    const [focused] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (focused?.id != null) return focused.id;
  } catch {
    // ignore
  }
  return undefined;
}

/** Notify the active tab's content script; no-op on restricted pages. */
export async function notifyActiveTab(
  type: ContentMessageType,
  payload?: { settings?: DastresaSettings } & Record<string, unknown>,
): Promise<boolean> {
  const tabId = await resolveTargetTabId();
  if (tabId == null) return false;
  try {
    await chrome.tabs.sendMessage(tabId, { type, ...payload });
    return true;
  } catch {
    // Content script may be missing on chrome:// and other restricted pages.
    return false;
  }
}
