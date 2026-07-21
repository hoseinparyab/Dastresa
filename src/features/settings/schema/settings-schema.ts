import { z } from 'zod';

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

export const DastresaSettingsSchema = z.object({
  /**
   * Global master switch. When false, no page gets the toolbar/themes/zoom.
   * Defaults off so install does not rewrite every website.
   */
  extensionActive: z.boolean().default(false),
  /** Hostnames where Dastresa stays off even if extensionActive is true. */
  disabledSites: z.array(z.string()).default([]),
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
});

export type DastresaSettings = z.infer<typeof DastresaSettingsSchema>;
export type ThemeId = z.infer<typeof ThemeIdSchema>;
export type ZoomSettings = z.infer<typeof ZoomSettingsSchema>;
export type SpeechSettings = z.infer<typeof SpeechSettingsSchema>;
export type FocusCursorColor = z.infer<typeof FocusCursorColorSchema>;

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
  });
}

/** Reset visual settings to a clean browser look; keep locale, speech prefs, site list. */
export function createPageResetSettings(current?: Partial<DastresaSettings>): DastresaSettings {
  const locale = current?.locale ?? 'fa';
  const dir = current?.dir ?? (locale === 'fa' ? 'rtl' : 'ltr');
  return parseSettings({
    extensionActive: current?.extensionActive ?? true,
    disabledSites: current?.disabledSites ?? [],
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
  });
}

export function isSiteDisabled(settings: DastresaSettings, hostname: string): boolean {
  if (!hostname) return false;
  return settings.disabledSites.some(
    (site) => site === hostname || hostname.endsWith(`.${site}`),
  );
}

export function withSiteDisabled(
  settings: DastresaSettings,
  hostname: string,
  disabled: boolean,
): DastresaSettings {
  const host = hostname.trim().toLowerCase();
  if (!host) return settings;
  const set = new Set(settings.disabledSites.map((s) => s.toLowerCase()));
  if (disabled) set.add(host);
  else set.delete(host);
  return parseSettings({ ...settings, disabledSites: [...set].sort() });
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

  assignIfValid('extensionActive', z.boolean(), raw.extensionActive);
  assignIfValid('disabledSites', z.array(z.string()), raw.disabledSites);
  assignIfValid('theme', ThemeIdSchema, raw.theme);
  assignIfValid('largeCursor', z.boolean(), raw.largeCursor);
  assignIfValid('largeButtons', z.boolean(), raw.largeButtons);
  assignIfValid('readerMode', z.boolean(), raw.readerMode);
  assignIfValid('readingFocus', z.boolean(), raw.readingFocus);
  assignIfValid('readingRuler', z.boolean(), raw.readingRuler);
  assignIfValid('focusCursorColor', FocusCursorColorSchema, raw.focusCursorColor);
  assignIfValid('locale', z.enum(['en', 'fa']), raw.locale);
  assignIfValid('dir', z.enum(['ltr', 'rtl']), raw.dir);

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

  // Keep locale/dir paired when only one survives.
  if (salvage.locale === 'fa') salvage.dir = salvage.dir ?? 'rtl';
  if (salvage.locale === 'en' && salvage.dir === undefined) salvage.dir = 'ltr';

  return DastresaSettingsSchema.parse(salvage);
}
