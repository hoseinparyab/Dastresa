import type { FeatureContext, IFeature, IStorage } from '@/core/contracts';
import { EVENTS, FEATURE_IDS, STORAGE_KEYS } from '@/core/constants';
import {
  createDefaultSettings,
  parseSettings,
  type DastresaSettings,
} from './schema/settings-schema';

export class SettingsService {
  private settings: DastresaSettings = createDefaultSettings();
  private unwatch?: () => void;

  constructor(
    private readonly storage: IStorage,
    private readonly onChange: (settings: DastresaSettings) => void,
  ) {}

  async hydrate(): Promise<DastresaSettings> {
    const raw = await this.storage.get<unknown>(STORAGE_KEYS.SETTINGS);
    this.settings = parseSettings(raw);
    this.unwatch = this.storage.watch<unknown>(STORAGE_KEYS.SETTINGS, (value) => {
      this.settings = parseSettings(value);
      this.onChange(this.settings);
    });
    return this.settings;
  }

  get(): DastresaSettings {
    return this.settings;
  }

  async update(partial: Partial<DastresaSettings>): Promise<DastresaSettings> {
    this.settings = parseSettings({ ...this.settings, ...partial });
    await this.storage.set(STORAGE_KEYS.SETTINGS, this.settings);
    this.onChange(this.settings);
    return this.settings;
  }

  async replace(next: DastresaSettings): Promise<DastresaSettings> {
    this.settings = parseSettings(next);
    await this.storage.set(STORAGE_KEYS.SETTINGS, this.settings);
    this.onChange(this.settings);
    return this.settings;
  }

  dispose(): void {
    this.unwatch?.();
  }
}

export class SettingsFeature implements IFeature {
  readonly id = FEATURE_IDS.SETTINGS;
  readonly name = 'Settings';
  readonly version = '0.1.0';
  private enabled = true;
  private service?: SettingsService;

  async initialize(ctx: FeatureContext): Promise<void> {
    this.service = new SettingsService(ctx.storage, (settings) => {
      ctx.bus.emit(EVENTS.SETTINGS_CHANGED, { settings });
    });
    await this.service.hydrate();
    ctx.bus.emit(EVENTS.SETTINGS_CHANGED, { settings: this.service.get() });
  }

  dispose(): void {
    this.service?.dispose();
    this.enabled = false;
  }

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getService(): SettingsService {
    if (!this.service) throw new Error('SettingsFeature not initialized');
    return this.service;
  }
}

export const feature = new SettingsFeature();
export default feature;

export * from './schema/settings-schema';
