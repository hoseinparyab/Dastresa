import { describe, expect, it } from 'vitest';
import {
  createDefaultSettings,
  createPageResetSettings,
  parseSettings,
  DastresaSettingsSchema,
} from '@/features/settings/schema/settings-schema';

describe('settings schema', () => {
  it('creates defaults', () => {
    const settings = createDefaultSettings();
    expect(settings.extensionActive).toBe(true);
    expect(settings.theme).toBe('dark');
    expect(settings.largeButtons).toBe(true);
    expect(settings.speech.preferPersian).toBe(true);
  });

  it('resets every visual setting to a clean browser look', () => {
    const reset = createPageResetSettings({ locale: 'fa', dir: 'rtl', theme: 'yellow-black' });
    expect(reset.extensionActive).toBe(true);
    expect(reset.theme).toBe('normal');
    expect(reset.zoom.textScale).toBe(1);
    expect(reset.largeButtons).toBe(false);
    expect(reset.largeCursor).toBe(false);
    expect(reset.readerMode).toBe(false);
    expect(reset.readingFocus).toBe(false);
    expect(reset.toolbarPosition).toEqual({ x: 24, y: 24 });
    expect(reset.locale).toBe('en');
  });

  it('recovers from invalid input', () => {
    const settings = parseSettings({ theme: 'nope', zoom: 'bad' });
    expect(settings.theme).toBe('dark');
    expect(DastresaSettingsSchema.safeParse(settings).success).toBe(true);
  });
});
