import { describe, expect, it } from 'vitest';
import { createEventBus } from '@/core/event-bus';
import { createModuleRegistry } from '@/core/module-registry';
import { createMemoryStorage } from '@/features/storage';
import { SettingsFeature } from '@/features/settings';
import { DomAnalyzerFeature } from '@/features/dom-analyzer';
import { FEATURE_IDS } from '@/core/constants';

describe('feature integration', () => {
  it('initializes settings and dom analyzer independently', async () => {
    const bus = createEventBus();
    const storage = createMemoryStorage();
    const registry = createModuleRegistry();
    const ctx = { bus, storage, document, window };

    const settings = new SettingsFeature();
    const dom = new DomAnalyzerFeature();
    registry.register(settings);
    registry.register(dom);

    let settingsEvents = 0;
    bus.on('settings:changed', () => {
      settingsEvents += 1;
    });

    await settings.initialize(ctx);
    await dom.initialize(ctx);

    expect(registry.get(FEATURE_IDS.SETTINGS)?.isEnabled()).toBe(true);
    expect(registry.get(FEATURE_IDS.DOM_ANALYZER)?.isEnabled()).toBe(true);
    expect(settingsEvents).toBeGreaterThan(0);

    await settings.disable();
    expect(settings.isEnabled()).toBe(false);
    expect(dom.isEnabled()).toBe(true);
  });
});
