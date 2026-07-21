import { describe, expect, it } from 'vitest';
import {
  createDefaultSettings,
  createPageResetSettings,
  isSiteDisabled,
  parseSettings,
  withSiteDisabled,
  DastresaSettingsSchema,
} from '@/features/settings/schema/settings-schema';

describe('settings schema', () => {
  it('creates safe opt-in defaults', () => {
    const settings = createDefaultSettings();
    expect(settings.extensionActive).toBe(false);
    expect(settings.theme).toBe('normal');
    expect(settings.largeButtons).toBe(false);
    expect(settings.zoom.textScale).toBe(1);
    expect(settings.locale).toBe('fa');
    expect(settings.dir).toBe('rtl');
    expect(settings.disabledSites).toEqual([]);
    expect(settings.speech.preferPersian).toBe(true);
  });

  it('resets visuals but preserves locale and site list', () => {
    const reset = createPageResetSettings({
      locale: 'fa',
      dir: 'rtl',
      theme: 'yellow-black',
      disabledSites: ['github.com'],
      extensionActive: true,
    });
    expect(reset.extensionActive).toBe(true);
    expect(reset.theme).toBe('normal');
    expect(reset.zoom.textScale).toBe(1);
    expect(reset.largeButtons).toBe(false);
    expect(reset.largeCursor).toBe(false);
    expect(reset.readerMode).toBe(false);
    expect(reset.readingFocus).toBe(false);
    expect(reset.locale).toBe('fa');
    expect(reset.dir).toBe('rtl');
    expect(reset.disabledSites).toEqual(['github.com']);
  });

  it('tracks per-site disable list', () => {
    const base = createDefaultSettings();
    const off = withSiteDisabled(base, 'github.com', true);
    expect(isSiteDisabled(off, 'github.com')).toBe(true);
    expect(isSiteDisabled(off, 'gist.github.com')).toBe(true);
    const on = withSiteDisabled(off, 'github.com', false);
    expect(isSiteDisabled(on, 'github.com')).toBe(false);
  });

  it('recovers from invalid input', () => {
    const settings = parseSettings({ theme: 'nope', zoom: 'bad' });
    expect(settings.theme).toBe('normal');
    expect(DastresaSettingsSchema.safeParse(settings).success).toBe(true);
  });

  it('soft-recovers valid fields when some keys are corrupt', () => {
    const settings = parseSettings({
      extensionActive: true,
      theme: 'high-contrast',
      locale: 'fa',
      dir: 'rtl',
      disabledSites: ['example.com'],
      zoom: { textScale: 1.5, nope: true },
      speech: 'broken',
      largeButtons: 'yes',
    });
    expect(settings.extensionActive).toBe(true);
    expect(settings.theme).toBe('high-contrast');
    expect(settings.locale).toBe('fa');
    expect(settings.disabledSites).toEqual(['example.com']);
    expect(settings.zoom.textScale).toBe(1.5);
    expect(settings.speech.preferPersian).toBe(true);
    expect(settings.largeButtons).toBe(false);
    expect(DastresaSettingsSchema.safeParse(settings).success).toBe(true);
  });
});
