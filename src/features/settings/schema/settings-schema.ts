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
  textScale: z.number().min(0.8).max(2.5).default(1.15),
  imageScale: z.number().min(0.5).max(2).default(1),
  lineHeight: z.number().min(1.2).max(2.4).default(1.7),
  letterSpacing: z.number().min(0).max(0.2).default(0.02),
  wordSpacing: z.number().min(0).max(0.5).default(0.05),
  contentWidth: z.number().min(40).max(100).default(72),
  maxLineLength: z.number().min(40).max(100).default(70),
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
  /** When false, page stays at browser defaults (no toolbar / themes / zoom). */
  extensionActive: z.boolean().default(true),
  theme: ThemeIdSchema.default('dark'),
  largeCursor: z.boolean().default(false),
  largeButtons: z.boolean().default(true),
  readerMode: z.boolean().default(false),
  readingFocus: z.boolean().default(false),
  readingRuler: z.boolean().default(false),
  /** High-visibility pointer color used while Reading Focus is on. */
  focusCursorColor: FocusCursorColorSchema.default('yellow'),
  zoom: ZoomSettingsSchema.default({
    textScale: 1.15,
    imageScale: 1,
    lineHeight: 1.7,
    letterSpacing: 0.02,
    wordSpacing: 0.05,
    contentWidth: 72,
    maxLineLength: 70,
  }),
  speech: SpeechSettingsSchema.default({
    rate: 1,
    pitch: 1,
    volume: 1,
    voiceURI: '',
    preferPersian: true,
  }),
  toolbarPosition: ToolbarPositionSchema.default({ x: 24, y: 24 }),
  locale: z.enum(['en', 'fa']).default('en'),
  dir: z.enum(['ltr', 'rtl']).default('ltr'),
});

export type DastresaSettings = z.infer<typeof DastresaSettingsSchema>;
export type ThemeId = z.infer<typeof ThemeIdSchema>;
export type ZoomSettings = z.infer<typeof ZoomSettingsSchema>;
export type SpeechSettings = z.infer<typeof SpeechSettingsSchema>;
export type FocusCursorColor = z.infer<typeof FocusCursorColorSchema>;

export function createDefaultSettings(): DastresaSettings {
  return DastresaSettingsSchema.parse({});
}

/** Reset every setting to a clean browser look, keep Dastresa toolbar active. */
export function createPageResetSettings(_current?: Partial<DastresaSettings>): DastresaSettings {
  return parseSettings({
    extensionActive: true,
    theme: 'normal',
    largeCursor: false,
    largeButtons: false,
    readerMode: false,
    readingFocus: false,
    readingRuler: false,
    focusCursorColor: 'yellow',
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
      rate: 1,
      pitch: 1,
      volume: 1,
      voiceURI: '',
      preferPersian: true,
    },
    toolbarPosition: { x: 24, y: 24 },
    locale: 'en',
    dir: 'ltr',
  });
}

export function parseSettings(input: unknown): DastresaSettings {
  const result = DastresaSettingsSchema.safeParse(input ?? {});
  if (result.success) return result.data;
  return createDefaultSettings();
}
