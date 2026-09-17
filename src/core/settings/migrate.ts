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
 * v1 (implicit 1.1.x) → v2: add schemaVersion, activeProfile, sitePreferences.
 */
export function migrateSettings(raw: unknown): DastresaSettings {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return parseSettings({ schemaVersion: SETTINGS_SCHEMA_VERSION });
  }

  const input = { ...(raw as LegacySettings) };
  const version = typeof input.schemaVersion === 'number' ? input.schemaVersion : 1;

  if (version < 2) {
    input.schemaVersion = SETTINGS_SCHEMA_VERSION;
    input.activeProfile = input.activeProfile ?? 'custom';
    input.sitePreferences = input.sitePreferences ?? {};
  }

  if ((input.schemaVersion ?? 1) < SETTINGS_SCHEMA_VERSION) {
    input.schemaVersion = SETTINGS_SCHEMA_VERSION;
  }

  return parseSettings(input);
}

export function createVersionedDefaults(): DastresaSettings {
  return createDefaultSettings();
}
