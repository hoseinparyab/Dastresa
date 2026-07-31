import { createContainer } from '@/core/di';
import { EVENTS } from '@/core/constants';
import { createChromeStorage, feature as storageFeature } from '@/features/storage';
import { feature as settingsFeature } from '@/features/settings';
import {
  createRuntime,
  ensureRegistered,
  handleExit,
  handleReset,
  settingsService,
  shouldRunOnPage,
  startProductFeatures,
  syncActiveState,
} from '@/content/lifecycle';
import { registerContentMessageHandlers } from '@/content/messaging';

async function boot(): Promise<void> {
  if (window.__DASTRESA_BOOTED__) return;
  window.__DASTRESA_BOOTED__ = true;

  const storage = createChromeStorage();
  const container = createContainer(storage);
  const runtime = createRuntime(container);
  const ctx = container.createFeatureContext();

  await ensureRegistered(container, storageFeature);
  await ensureRegistered(container, settingsFeature);
  await storageFeature.initialize(ctx);
  await settingsFeature.initialize(ctx);

  const settings = settingsService().get();

  container.bus.on(EVENTS.TOOLBAR_COMMAND, ({ command }) => {
    if (command === 'exit') {
      void handleExit(runtime);
    }
    if (command === 'reset') {
      void handleReset(runtime);
    }
  });

  container.bus.on(EVENTS.TOOLBAR_MOVED, ({ x, y }) => {
    void settingsService().update({ toolbarPosition: { x, y } });
  });

  container.bus.on(EVENTS.SETTINGS_CHANGED, ({ settings: next }) => {
    void syncActiveState(runtime, next);
  });

  registerContentMessageHandlers(runtime);

  if (shouldRunOnPage(settings)) {
    await startProductFeatures(runtime);
    container.bus.emit(EVENTS.SETTINGS_CHANGED, { settings });
  }
}

void boot().catch((error) => {
  console.error('[Dastresa] Content script failed to boot', error);
});
