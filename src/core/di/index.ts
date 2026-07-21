import type { FeatureContext, IEventBus, IModuleRegistry, IStorage } from '@/core/contracts';
import { createEventBus } from '@/core/event-bus';
import { createModuleRegistry } from '@/core/module-registry';

export interface AppContainer {
  bus: IEventBus;
  registry: IModuleRegistry;
  storage: IStorage;
  createFeatureContext(doc?: Document, win?: Window): FeatureContext;
}

export function createContainer(storage: IStorage): AppContainer {
  const bus = createEventBus();
  const registry = createModuleRegistry();

  return {
    bus,
    registry,
    storage,
    createFeatureContext(doc = document, win = window): FeatureContext {
      return { bus, storage, document: doc, window: win };
    },
  };
}
