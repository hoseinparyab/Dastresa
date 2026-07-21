import type { FeatureContext, IFeature } from '@/core/contracts';
import { FEATURE_IDS } from '@/core/constants';

export class StorageFeature implements IFeature {
  readonly id = FEATURE_IDS.STORAGE;
  readonly name = 'Storage';
  readonly version = '0.1.0';
  private enabled = true;

  initialize(_ctx: FeatureContext): void {
    // Storage is infrastructure; always available via createChromeStorage().
  }

  dispose(): void {
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
}

export const feature = new StorageFeature();
export default feature;

export {
  createChromeStorage,
  createMemoryStorage,
  ChromeLocalStorage,
  MemoryStorage,
} from './services/chrome-storage';
