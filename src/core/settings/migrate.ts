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
 * v2 → v3: Persian-first locale/dir (fixes installs seeded with English)
 */
export function migrateSettings(raw: unknown): DastresaSettings {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return parseSettings({ schemaVersion: SETTINGS_SCHEMA_VERSION });
  }

  const input = { ...(raw as LegacySettings) };
  const version = typeof input.schemaVersion === 'number' ? input.schemaVersion : 1;

  if (version < 2) {
    input.activeProfile = input.activeProfile ?? 'custom';
    input.sitePreferences = input.sitePreferences ?? {};
  }

  if (version < 3) {
    // Product default is Persian; older builds / English browser UI often left locale=en.
    input.locale = 'fa';
    input.dir = 'rtl';
  }

  if ((input.schemaVersion ?? 1) < SETTINGS_SCHEMA_VERSION) {
    input.schemaVersion = SETTINGS_SCHEMA_VERSION;
  }

  return parseSettings(input);
}

export function createVersionedDefaults(): DastresaSettings {
  return createDefaultSettings();
}
