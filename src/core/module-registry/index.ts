import type { IFeature, IModuleRegistry } from '@/core/contracts';

export class ModuleRegistry implements IModuleRegistry {
  private readonly features = new Map<string, IFeature>();

  register(feature: IFeature): void {
    if (this.features.has(feature.id)) {
      throw new Error(`Feature already registered: ${feature.id}`);
    }
    this.features.set(feature.id, feature);
  }

  get(id: string): IFeature | undefined {
    return this.features.get(id);
  }

  getAll(): IFeature[] {
    return [...this.features.values()];
  }

  async loadLazy(
    id: string,
    loader: () => Promise<{ default?: IFeature; feature?: IFeature }>,
  ): Promise<IFeature> {
    const existing = this.get(id);
    if (existing) return existing;

    const mod = await loader();
    const feature = mod.feature ?? mod.default;
    if (!feature) {
      throw new Error(`Lazy loader for ${id} did not export a feature`);
    }
    this.register(feature);
    return feature;
  }
}

export function createModuleRegistry(): IModuleRegistry {
  return new ModuleRegistry();
}
