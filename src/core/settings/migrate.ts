import {
  createDefaultSettings,
  parseSettings,
  SETTINGS_SCHEMA_VERSION,
  type DastresaSettings,
} from './schema';

export { SETTINGS_SCHEMA_VERSION };

type LegacySettings = Partial<DastresaSettings> & {
  schemaVersion?: number;
};

/**
 * Migrate stored settings from older schemas without erasing valid fields.
 * v1 → v2: schemaVersion, activeProfile, sitePreferences
 * v2 → v4: Persian locale unless the user explicitly pinned a language.
 */
export function migrateSettings(raw: unknown): DastresaSettings {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return parseSettings({ schemaVersion: SETTINGS_SCHEMA_VERSION, locale: 'fa', dir: 'rtl' });
  }

  const input = { ...(raw as LegacySettings) };
  const version = typeof input.schemaVersion === 'number' ? input.schemaVersion : 1;

  if (version < 2) {
    input.activeProfile = input.activeProfile ?? 'custom';
    input.sitePreferences = input.sitePreferences ?? {};
  }

  if (version < 4 && input.localePinned !== true) {
    input.locale = 'fa';
    input.dir = 'rtl';
    input.localePinned = false;
  }

  if ((input.schemaVersion ?? 1) < SETTINGS_SCHEMA_VERSION) {
    input.schemaVersion = SETTINGS_SCHEMA_VERSION;
  }

  return parseSettings(input);
}

export function createVersionedDefaults(): DastresaSettings {
  return createDefaultSettings();
}
