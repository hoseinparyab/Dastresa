import type { FeatureContext, IFeature, IStorage } from '@/core/contracts';
import { EVENTS, FEATURE_IDS, STORAGE_KEYS } from '@/core/constants';
import {
  createDefaultSettings,
  mergeSettings,
  migrateSettings,
  parseSettings,
  type DastresaSettings,
} from '@/core/settings';

export class SettingsService {
  private settings: DastresaSettings = createDefaultSettings();
  private unwatch?: () => void;
  /** >0 while a local write is in flight (ignores echo from storage.watch). */
  private suppressWatch = 0;

  constructor(
    private readonly storage: IStorage,
    private readonly onChange: (settings: DastresaSettings) => void,
  ) {}

  async hydrate(): Promise<DastresaSettings> {
    const raw = await this.storage.get<unknown>(STORAGE_KEYS.SETTINGS);
    this.settings = migrateSettings(raw);
    // Persist migrated shape once so older installs upgrade cleanly.
    if (
      !raw ||
      typeof raw !== 'object' ||
      (raw as { schemaVersion?: number }).schemaVersion !== this.settings.schemaVersion
    ) {
      await this.storage.set(STORAGE_KEYS.SETTINGS, this.settings);
    }
    this.unwatch = this.storage.watch<unknown>(STORAGE_KEYS.SETTINGS, (value) => {
      this.settings = migrateSettings(value);
      if (this.suppressWatch > 0) return;
      this.onChange(this.settings);
    });
    return this.settings;
  }

  get(): DastresaSettings {
    return this.settings;
  }

  private async commit(next: DastresaSettings): Promise<DastresaSettings> {
    this.settings = next;
    this.suppressWatch += 1;
    try {
      await this.storage.set(STORAGE_KEYS.SETTINGS, this.settings);
      this.onChange(this.settings);
      return this.settings;
    } finally {
      // Chrome onChanged may arrive after await; clear on next macrotask.
      setTimeout(() => {
        this.suppressWatch = Math.max(0, this.suppressWatch - 1);
      }, 0);
    }
  }

  async update(partial: Partial<DastresaSettings>): Promise<DastresaSettings> {
    return this.commit(mergeSettings(this.settings, partial));
  }

  async replace(next: DastresaSettings): Promise<DastresaSettings> {
    return this.commit(parseSettings(next));
  }

  dispose(): void {
    this.unwatch?.();
  }
}

export class SettingsFeature implements IFeature {
  readonly id = FEATURE_IDS.SETTINGS;
  readonly name = 'Settings';
  readonly version = '1.2.0';
  private enabled = true;
  private service?: SettingsService;
  private lastProfile?: DastresaSettings['activeProfile'];

  async initialize(ctx: FeatureContext): Promise<void> {
    this.service = new SettingsService(ctx.storage, (settings) => {
      ctx.bus.emit(EVENTS.SETTINGS_CHANGED, { settings });
      if (this.lastProfile !== settings.activeProfile) {
        this.lastProfile = settings.activeProfile;
        ctx.bus.emit(EVENTS.PROFILE_CHANGED, { profileId: settings.activeProfile });
      }
    });
    await this.service.hydrate();
    this.lastProfile = this.service.get().activeProfile;
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

export * from '@/core/settings';
export { patchStoredSettings } from './services/patch-settings';
