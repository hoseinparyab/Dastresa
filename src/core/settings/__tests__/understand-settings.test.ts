import { describe, expect, it } from 'vitest';
import {
  applyProfileSettings,
  createDefaultSettings,
  isSiteDisabled,
  migrateSettings,
  normalizeSiteKey,
  parseSettings,
  resolveEffectiveSettings,
  SETTINGS_SCHEMA_VERSION,
} from '@/core/settings';

describe('settings migration v2', () => {
  it('upgrades legacy 1.1 settings without wiping fields', () => {
    const migrated = migrateSettings({
      extensionActive: true,
      theme: 'dark',
      locale: 'fa',
      disabledSites: ['example.com'],
    });
    expect(migrated.schemaVersion).toBe(SETTINGS_SCHEMA_VERSION);
    expect(migrated.activeProfile).toBe('custom');
    expect(migrated.sitePreferences).toEqual({});
    expect(migrated.theme).toBe('dark');
    expect(migrated.extensionActive).toBe(true);
    expect(migrated.disabledSites).toContain('example.com');
  });
});

describe('accessibility profiles', () => {
  it('applies low-vision preset onto current settings', () => {
    const base = createDefaultSettings();
    const next = applyProfileSettings(base, 'low-vision');
    expect(next.activeProfile).toBe('low-vision');
    expect(next.theme).toBe('high-contrast');
    expect(next.largeButtons).toBe(true);
    expect(next.zoom.textScale).toBeGreaterThan(1.2);
    expect(next.locale).toBe(base.locale);
  });

  it('custom profile only sets activeProfile', () => {
    const base = parseSettings({ theme: 'yellow-black', activeProfile: 'reading' });
    const next = applyProfileSettings(base, 'custom');
    expect(next.activeProfile).toBe('custom');
    expect(next.theme).toBe('yellow-black');
  });
});

describe('site preferences', () => {
  it('normalizes site keys', () => {
    expect(normalizeSiteKey('https://WWW.Example.com/path')).toBe('example.com');
    expect(normalizeSiteKey('localhost:3000')).toBe('localhost:3000');
  });

  it('resolves per-site overrides', () => {
    const settings = parseSettings({
      theme: 'normal',
      zoom: { textScale: 1 },
      sitePreferences: {
        'example.com': { theme: 'dark', textScale: 1.4 },
      },
    });
    const effective = resolveEffectiveSettings(settings, 'www.example.com');
    expect(effective.theme).toBe('dark');
    expect(effective.zoom.textScale).toBe(1.4);
  });

  it('treats sitePreferences.enabled=false as disabled', () => {
    const settings = parseSettings({
      extensionActive: true,
      sitePreferences: { 'news.example': { enabled: false } },
    });
    expect(isSiteDisabled(settings, 'news.example')).toBe(true);
  });
});
