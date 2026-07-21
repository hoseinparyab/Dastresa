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

export function parseSettings(input: unknown): DastresaSettings {
  const result = DastresaSettingsSchema.safeParse(input ?? {});
  if (result.success) return result.data;
  return createDefaultSettings();
}
