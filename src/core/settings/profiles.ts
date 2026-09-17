import {
  mergeSettings,
  type DastresaSettings,
  type ProfileId,
  type ThemeId,
} from '@/core/settings/schema';

export type { ProfileId };

export interface AccessibilityProfile {
  id: ProfileId;
  /** i18n key suffix under profiles.* */
  labelKey: string;
  settings: Partial<DastresaSettings>;
}

/** Presets map onto existing settings — they are not diagnoses. */
export const ACCESSIBILITY_PROFILES: AccessibilityProfile[] = [
  {
    id: 'normal',
    labelKey: 'profileNormal',
    settings: {
      theme: 'normal' satisfies ThemeId,
      largeCursor: false,
      largeButtons: false,
      readerMode: false,
      readingFocus: false,
      readingRuler: false,
      zoom: {
        textScale: 1,
        imageScale: 1,
        lineHeight: 1.2,
        letterSpacing: 0,
        wordSpacing: 0,
        contentWidth: 100,
        maxLineLength: 100,
      },
    },
  },
  {
    id: 'low-vision',
    labelKey: 'profileLowVision',
    settings: {
      theme: 'high-contrast',
      largeCursor: true,
      largeButtons: true,
      readingFocus: false,
      readingRuler: false,
      zoom: {
        textScale: 1.45,
        imageScale: 1,
        lineHeight: 1.7,
        letterSpacing: 0.04,
        wordSpacing: 0.12,
        contentWidth: 70,
        maxLineLength: 70,
      },
    },
  },
  {
    id: 'elderly',
    labelKey: 'profileElderly',
    settings: {
      theme: 'high-contrast',
      largeCursor: true,
      largeButtons: true,
      readingFocus: false,
      readingRuler: false,
      zoom: {
        textScale: 1.35,
        imageScale: 1,
        lineHeight: 1.65,
        letterSpacing: 0.03,
        wordSpacing: 0.1,
        contentWidth: 68,
        maxLineLength: 68,
      },
    },
  },
  {
    id: 'reading',
    labelKey: 'profileReading',
    settings: {
      theme: 'light',
      readerMode: true,
      readingFocus: true,
      readingRuler: true,
      largeButtons: true,
      zoom: {
        textScale: 1.2,
        imageScale: 1,
        lineHeight: 1.75,
        letterSpacing: 0.02,
        wordSpacing: 0.08,
        contentWidth: 65,
        maxLineLength: 65,
      },
    },
  },
  {
    id: 'high-contrast',
    labelKey: 'profileHighContrast',
    settings: {
      theme: 'high-contrast',
      largeCursor: true,
      largeButtons: true,
      zoom: {
        textScale: 1.15,
        imageScale: 1,
        lineHeight: 1.55,
        letterSpacing: 0.02,
        wordSpacing: 0.06,
        contentWidth: 75,
        maxLineLength: 75,
      },
    },
  },
  {
    id: 'custom',
    labelKey: 'profileCustom',
    settings: {},
  },
];

export function getProfile(id: ProfileId): AccessibilityProfile {
  return ACCESSIBILITY_PROFILES.find((p) => p.id === id) ?? ACCESSIBILITY_PROFILES[0]!;
}

/** Apply a preset without deleting unrelated user prefs (locale, speech voice, etc.). */
export function applyProfileSettings(
  current: DastresaSettings,
  profileId: ProfileId,
): DastresaSettings {
  if (profileId === 'custom') {
    return mergeSettings(current, { activeProfile: 'custom' });
  }
  const profile = getProfile(profileId);
  return mergeSettings(current, {
    ...profile.settings,
    activeProfile: profileId,
  });
}

