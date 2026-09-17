import { z } from 'zod';
import { normalizeSiteKey } from './site-key';

export const SETTINGS_SCHEMA_VERSION = 2;

export const ThemeIdSchema = z.enum([
  'normal',
  'dark',
  'light',
  'high-contrast',
  'black-white',
  'yellow-black',
]);

export const ZoomSettingsSchema = z.object({
  textScale: z.number().min(0.8).max(2.5).default(1),
  imageScale: z.number().min(0.5).max(2).default(1),
  lineHeight: z.number().min(1.2).max(2.4).default(1.2),
  letterSpacing: z.number().min(0).max(0.2).default(0),
  wordSpacing: z.number().min(0).max(0.5).default(0),
  contentWidth: z.number().min(40).max(100).default(100),
  maxLineLength: z.number().min(40).max(100).default(100),
});

export const SpeechSettingsSchema = z.object({
  rate: z.number().min(0.5).max(2).default(1),
  pitch: z.number().min(0.5).max(2).default(1),
  volume: z.number().min(0).max(1).default(1),
  voiceURI: z.string().default(''),
  preferPersian: z.boolean().default(true),
});

export const ToolbarPositionSchema = z.object({
  x: z.number().default(24),
  y: z.number().default(24),
});

export const FocusCursorColorSchema = z.enum(['sky', 'yellow', 'lime', 'magenta', 'white']);

/** Chrome UI of popup/options — independent from page theme. */
export const UiChromeSchema = z.enum(['light', 'dark']);

export const ProfileIdSchema = z.enum([
  'normal',
  'low-vision',
  'elderly',
  'reading',
  'high-contrast',
  'custom',
]);

export const SitePreferencesSchema = z.object({
  enabled: z.boolean().optional(),
  theme: ThemeIdSchema.optional(),
  textScale: z.number().min(0.8).max(2.5).optional(),
  lineHeight: z.number().min(1.2).max(2.4).optional(),
  letterSpacing: z.number().min(0).max(0.2).optional(),
  wordSpacing: z.number().min(0).max(0.5).optional(),
  contentWidth: z.number().min(40).max(100).optional(),
  speechRate: z.number().min(0.5).max(2).optional(),
  readerMode: z.boolean().optional(),
  readingFocus: z.boolean().optional(),
});

export const DastresaSettingsSchema = z.object({
  /** Settings shape version for migrations. */
  schemaVersion: z.number().int().min(1).default(SETTINGS_SCHEMA_VERSION),
  /**
   * Global master switch. When false, no page gets the toolbar/themes/zoom.
   * Defaults off so install does not rewrite every website.
   */
  extensionActive: z.boolean().default(false),
  /** Hostnames where Dastresa stays off even if extensionActive is true. */
  disabledSites: z.array(z.string()).default([]),
  /** Per-site overrides (normalized host keys). Only store diffs. */
  sitePreferences: z.record(z.string(), SitePreferencesSchema).default({}),
  /** Active accessibility profile preset id. */
  activeProfile: ProfileIdSchema.default('custom'),
  theme: ThemeIdSchema.default('normal'),
  largeCursor: z.boolean().default(false),
  largeButtons: z.boolean().default(false),
  readerMode: z.boolean().default(false),
  readingFocus: z.boolean().default(false),
  readingRuler: z.boolean().default(false),
  /** High-visibility pointer color used while Reading Focus is on. */
  focusCursorColor: FocusCursorColorSchema.default('yellow'),
  zoom: ZoomSettingsSchema.default({
    textScale: 1,
    imageScale: 1,
    lineHeight: 1.2,
    letterSpacing: 0,
    wordSpacing: 0,
    contentWidth: 100,
    maxLineLength: 100,
  }),
  speech: SpeechSettingsSchema.default({
    rate: 1,
    pitch: 1,
    volume: 1,
    voiceURI: '',
    preferPersian: true,
  }),
  toolbarPosition: ToolbarPositionSchema.default({ x: 24, y: 24 }),
  locale: z.enum(['en', 'fa']).default('fa'),
  dir: z.enum(['ltr', 'rtl']).default('rtl'),
  /** Popup / options chrome: light or dark (from design mockups). */
  uiChrome: UiChromeSchema.default('light'),
  /**
   * free = Dastresa backend (daily quota)
   * luma / gemini = user's own API key (bypass free limit)
   */
  summaryProvider: z.enum(['free', 'luma', 'gemini']).default('free'),
  /** Model id for luma or gemini when using own key */
  summaryModel: z.string().default('openai/gpt-4o-mini'),
});

export type DastresaSettings = z.infer<typeof DastresaSettingsSchema>;
export type ThemeId = z.infer<typeof ThemeIdSchema>;
export type ZoomSettings = z.infer<typeof ZoomSettingsSchema>;
export type SpeechSettings = z.infer<typeof SpeechSettingsSchema>;
export type FocusCursorColor = z.infer<typeof FocusCursorColorSchema>;
export type UiChrome = z.infer<typeof UiChromeSchema>;
export type ProfileId = z.infer<typeof ProfileIdSchema>;
export type SitePreferences = z.infer<typeof SitePreferencesSchema>;

export function createDefaultSettings(): DastresaSettings {
  return DastresaSettingsSchema.parse({});
}

/** Deep-merge a partial patch onto current settings, then validate. */
export function mergeSettings(
  current: DastresaSettings,
  partial: Partial<DastresaSettings>,
): DastresaSettings {
  return parseSettings({
    ...current,
    ...partial,
    zoom: { ...current.zoom, ...(partial.zoom ?? {}) },
    speech: { ...current.speech, ...(partial.speech ?? {}) },
    toolbarPosition: {
      ...current.toolbarPosition,
      ...(partial.toolbarPosition ?? {}),
    },
    disabledSites: partial.disabledSites ?? current.disabledSites,
    sitePreferences: partial.sitePreferences ?? current.sitePreferences,
  });
}

/** Reset visual settings to a clean browser look; keep locale, speech prefs, site list. */
export function createPageResetSettings(current?: Partial<DastresaSettings>): DastresaSettings {
  const locale = current?.locale ?? 'fa';
  const dir = current?.dir ?? (locale === 'fa' ? 'rtl' : 'ltr');
  return parseSettings({
    schemaVersion: SETTINGS_SCHEMA_VERSION,
    extensionActive: current?.extensionActive ?? true,
    disabledSites: current?.disabledSites ?? [],
    sitePreferences: current?.sitePreferences ?? {},
    activeProfile: 'custom',
    theme: 'normal',
    largeCursor: false,
    largeButtons: false,
    readerMode: false,
    readingFocus: false,
    readingRuler: false,
    focusCursorColor: current?.focusCursorColor ?? 'yellow',
    zoom: {
      textScale: 1,
      imageScale: 1,
      lineHeight: 1.2,
      letterSpacing: 0,
      wordSpacing: 0,
      contentWidth: 100,
      maxLineLength: 100,
    },
    speech: {
      rate: current?.speech?.rate ?? 1,
      pitch: current?.speech?.pitch ?? 1,
      volume: current?.speech?.volume ?? 1,
      voiceURI: current?.speech?.voiceURI ?? '',
      preferPersian: current?.speech?.preferPersian ?? true,
    },
    toolbarPosition: current?.toolbarPosition ?? { x: 24, y: 24 },
    locale,
    dir,
    summaryProvider: current?.summaryProvider ?? 'free',
    summaryModel: current?.summaryModel ?? 'openai/gpt-4o-mini',
  });
}

export function isSiteDisabled(settings: DastresaSettings, hostname: string): boolean {
  if (!hostname) return false;
  const key = normalizeSiteKey(hostname);
  if (
    settings.disabledSites.some(
      (site) => site === key || key.endsWith(`.${site}`) || site === hostname.toLowerCase(),
    )
  ) {
    return true;
  }
  const prefs = settings.sitePreferences?.[key] ?? settings.sitePreferences?.[hostname.toLowerCase()];
  return prefs?.enabled === false;
}

export function withSiteDisabled(
  settings: DastresaSettings,
  hostname: string,
  disabled: boolean,
): DastresaSettings {
  const host = normalizeSiteKey(hostname);
  if (!host) return settings;
  const set = new Set(settings.disabledSites.map((s) => normalizeSiteKey(s) || s.toLowerCase()));
  if (disabled) set.add(host);
  else set.delete(host);

  const sitePreferences = { ...settings.sitePreferences };
  const existing = sitePreferences[host] ?? {};
  if (disabled) {
    sitePreferences[host] = { ...existing, enabled: false };
  } else if (sitePreferences[host]) {
    const { enabled: _removed, ...rest } = sitePreferences[host]!;
    void _removed;
    if (Object.keys(rest).length === 0) delete sitePreferences[host];
    else sitePreferences[host] = { ...rest, enabled: true };
  }

  return parseSettings({
    ...settings,
    disabledSites: [...set].sort(),
    sitePreferences,
  });
}

/**
 * Validate settings without wiping good fields on partial corruption.
 * Invalid top-level / nested keys fall back to defaults for that key only.
 */
export function parseSettings(input: unknown): DastresaSettings {
  const direct = DastresaSettingsSchema.safeParse(input ?? {});
  if (direct.success) return direct.data;

  const base = createDefaultSettings();
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return base;
  }

  const raw = input as Record<string, unknown>;
  const salvage: Record<string, unknown> = { ...base };

  const assignIfValid = <T>(key: keyof DastresaSettings, schema: z.ZodType<T>, value: unknown) => {
    const parsed = schema.safeParse(value);
    if (parsed.success) salvage[key] = parsed.data;
  };

  assignIfValid('schemaVersion', z.number().int(), raw.schemaVersion);
  assignIfValid('extensionActive', z.boolean(), raw.extensionActive);
  assignIfValid('disabledSites', z.array(z.string()), raw.disabledSites);
  assignIfValid('activeProfile', ProfileIdSchema, raw.activeProfile);
  assignIfValid('theme', ThemeIdSchema, raw.theme);
  assignIfValid('largeCursor', z.boolean(), raw.largeCursor);
  assignIfValid('largeButtons', z.boolean(), raw.largeButtons);
  assignIfValid('readerMode', z.boolean(), raw.readerMode);
  assignIfValid('readingFocus', z.boolean(), raw.readingFocus);
  assignIfValid('readingRuler', z.boolean(), raw.readingRuler);
  assignIfValid('focusCursorColor', FocusCursorColorSchema, raw.focusCursorColor);
  assignIfValid('locale', z.enum(['en', 'fa']), raw.locale);
  assignIfValid('dir', z.enum(['ltr', 'rtl']), raw.dir);
  assignIfValid('uiChrome', UiChromeSchema, raw.uiChrome);
  assignIfValid('summaryProvider', z.enum(['free', 'luma', 'gemini']), raw.summaryProvider);
  assignIfValid('summaryModel', z.string().min(1), raw.summaryModel);

  if (raw.zoom && typeof raw.zoom === 'object') {
    const zoom = ZoomSettingsSchema.safeParse({ ...base.zoom, ...(raw.zoom as object) });
    if (zoom.success) salvage.zoom = zoom.data;
  }
  if (raw.speech && typeof raw.speech === 'object') {
    const speech = SpeechSettingsSchema.safeParse({ ...base.speech, ...(raw.speech as object) });
    if (speech.success) salvage.speech = speech.data;
  }
  if (raw.toolbarPosition && typeof raw.toolbarPosition === 'object') {
    const pos = ToolbarPositionSchema.safeParse({
      ...base.toolbarPosition,
      ...(raw.toolbarPosition as object),
    });
    if (pos.success) salvage.toolbarPosition = pos.data;
  }
  if (raw.sitePreferences && typeof raw.sitePreferences === 'object') {
    const prefs: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(raw.sitePreferences as Record<string, unknown>)) {
      const parsed = SitePreferencesSchema.safeParse(v);
      if (parsed.success) prefs[k] = parsed.data;
    }
    salvage.sitePreferences = prefs;
  }

  if (salvage.locale === 'fa') salvage.dir = salvage.dir ?? 'rtl';
  if (salvage.locale === 'en' && salvage.dir === undefined) salvage.dir = 'ltr';

  return DastresaSettingsSchema.parse(salvage);
}
