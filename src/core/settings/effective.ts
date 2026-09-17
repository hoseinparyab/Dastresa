import type { DastresaSettings, SitePreferences } from './schema';
import { mergeSettings } from './schema';
import { normalizeSiteKey } from './site-key';

/**
 * Resolve effective settings for a hostname: global + site overrides.
 * Does not mutate stored settings.
 */
export function resolveEffectiveSettings(
  settings: DastresaSettings,
  hostnameOrUrl: string,
): DastresaSettings {
  const key = normalizeSiteKey(hostnameOrUrl || '');
  if (!key) return settings;

  const prefs: SitePreferences | undefined =
    settings.sitePreferences[key] ??
    settings.sitePreferences[hostnameOrUrl.toLowerCase()];

  if (!prefs) return settings;

  const patch: Partial<DastresaSettings> = {};
  if (prefs.theme) patch.theme = prefs.theme;
  if (prefs.readerMode !== undefined) patch.readerMode = prefs.readerMode;
  if (prefs.readingFocus !== undefined) patch.readingFocus = prefs.readingFocus;

  const zoomPatch: Partial<DastresaSettings['zoom']> = {};
  if (prefs.textScale !== undefined) zoomPatch.textScale = prefs.textScale;
  if (prefs.lineHeight !== undefined) zoomPatch.lineHeight = prefs.lineHeight;
  if (prefs.letterSpacing !== undefined) zoomPatch.letterSpacing = prefs.letterSpacing;
  if (prefs.wordSpacing !== undefined) zoomPatch.wordSpacing = prefs.wordSpacing;
  if (prefs.contentWidth !== undefined) {
    zoomPatch.contentWidth = prefs.contentWidth;
    zoomPatch.maxLineLength = prefs.contentWidth;
  }
  if (Object.keys(zoomPatch).length) {
    patch.zoom = { ...settings.zoom, ...zoomPatch };
  }

  if (prefs.speechRate !== undefined) {
    patch.speech = { ...settings.speech, rate: prefs.speechRate };
  }

  return Object.keys(patch).length ? mergeSettings(settings, patch) : settings;
}

export function patchSitePreferences(
  settings: DastresaSettings,
  hostnameOrUrl: string,
  patch: SitePreferences,
): DastresaSettings {
  const key = normalizeSiteKey(hostnameOrUrl);
  if (!key) return settings;
  const current = settings.sitePreferences[key] ?? {};
  const next = { ...current, ...patch };
  // Drop empty override objects
  const cleaned = Object.fromEntries(
    Object.entries(next).filter(([, v]) => v !== undefined),
  ) as SitePreferences;
  const sitePreferences = { ...settings.sitePreferences };
  if (Object.keys(cleaned).length === 0) delete sitePreferences[key];
  else sitePreferences[key] = cleaned;
  return mergeSettings(settings, { sitePreferences });
}
