/**
 * Runtime helpers for content / background bootstraps.
 */
export function isExtensionRuntime(): boolean {
  return typeof chrome !== 'undefined' && Boolean(chrome.runtime?.id);
}
