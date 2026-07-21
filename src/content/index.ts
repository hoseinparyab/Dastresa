import { createContainer, type AppContainer } from '@/core/di';
import { EVENTS, FEATURE_IDS, STORAGE_KEYS } from '@/core/constants';
import type { IFeature } from '@/core/contracts';
import { createChromeStorage, feature as storageFeature } from '@/features/storage';
import type { SettingsFeature } from '@/features/settings';
import { feature as settingsFeature } from '@/features/settings';
import { feature as domAnalyzerFeature } from '@/features/dom-analyzer';
import { feature as smartZoomFeature } from '@/features/smart-zoom';
import { feature as themesFeature } from '@/features/themes';
import { feature as toolbarFeature } from '@/features/toolbar';
import {
  createPageResetSettings,
  isSiteDisabled,
  parseSettings,
  type DastresaSettings,
} from '@/features/settings/schema/settings-schema';

declare global {
  interface Window {
    __DASTRESA_BOOTED__?: boolean;
    __DASTRESA_ACTIVE__?: boolean;
  }
}

let container: AppContainer | undefined;
let productFeatures: IFeature[] = [];
let transitioning = false;

function pageHostname(): string {
  try {
    return window.location.hostname.toLowerCase();
  } catch {
    return '';
  }
}

function shouldRunOnPage(settings: DastresaSettings): boolean {
  return settings.extensionActive && !isSiteDisabled(settings, pageHostname());
}

function clearPageArtifacts(doc: Document): void {
  doc.querySelectorAll('[data-Dastresa-speech]').forEach((el) => {
    el.removeAttribute('data-Dastresa-speech');
  });
  doc.querySelectorAll('[data-Dastresa-focus]').forEach((el) => {
    el.removeAttribute('data-Dastresa-focus');
  });
  doc.getElementById('dastresa-ruler')?.remove();
  doc.getElementById('Dastresa-ruler')?.remove();
  doc.getElementById('Dastresa-cursor-halo')?.remove();
  doc.getElementById('Dastresa-focus-cursor')?.remove();
  doc.documentElement.classList.remove('dastresa-focus-cursor-on');
}

async function shutdown(): Promise<void> {
  for (const feature of [...productFeatures].reverse()) {
    try {
      await feature.disable();
      await feature.dispose();
    } catch (error) {
      console.error('[Dastresa] Failed to shut down feature', feature.id, error);
    }
  }
  productFeatures = [];
  clearPageArtifacts(document);
  window.__DASTRESA_ACTIVE__ = false;
  container?.bus.emit(EVENTS.EXTENSION_EXITED, undefined);
}

async function ensureRegistered(app: AppContainer, feature: IFeature): Promise<void> {
  if (!app.registry.get(feature.id)) {
    app.registry.register(feature);
  }
}

async function startProductFeatures(app: AppContainer): Promise<void> {
  const ctx = app.createFeatureContext();
  const critical = [domAnalyzerFeature, themesFeature, smartZoomFeature, toolbarFeature];

  productFeatures = [];

  for (const feature of critical) {
    await ensureRegistered(app, feature);
    await feature.initialize(ctx);
    await feature.enable();
    productFeatures.push(feature);
  }

  const reader = await app.registry.loadLazy(
    FEATURE_IDS.READER_MODE,
    () => import('@/features/reader-mode'),
  );
  await reader.initialize(ctx);
  productFeatures.push(reader);

  const tts = await app.registry.loadLazy(
    FEATURE_IDS.TEXT_TO_SPEECH,
    () => import('@/features/text-to-speech'),
  );
  await tts.initialize(ctx);
  await tts.enable();
  productFeatures.push(tts);

  const focus = await app.registry.loadLazy(
    FEATURE_IDS.READING_FOCUS,
    () => import('@/features/reading-focus'),
  );
  await focus.initialize(ctx);
  productFeatures.push(focus);

  window.__DASTRESA_ACTIVE__ = true;
  app.bus.emit(EVENTS.EXTENSION_ACTIVATED, undefined);
}

async function persistActive(active: boolean): Promise<void> {
  const storage = container?.storage ?? createChromeStorage();
  const raw = await storage.get<unknown>(STORAGE_KEYS.SETTINGS);
  const settings = parseSettings(raw);
  await storage.set(STORAGE_KEYS.SETTINGS, {
    ...settings,
    extensionActive: active,
    readerMode: active ? settings.readerMode : false,
    readingFocus: active ? settings.readingFocus : false,
  });
}

async function handleExit(): Promise<void> {
  if (transitioning || !window.__DASTRESA_ACTIVE__) return;
  transitioning = true;
  try {
    await shutdown();
    await persistActive(false);
  } finally {
    transitioning = false;
  }
}

/** Stop on this page only (global switch stays on; site is in disabledSites). */
async function handleSiteDeactivate(): Promise<void> {
  if (transitioning || !window.__DASTRESA_ACTIVE__) return;
  transitioning = true;
  try {
    await shutdown();
  } finally {
    transitioning = false;
  }
}

async function handleActivate(): Promise<void> {
  if (transitioning || window.__DASTRESA_ACTIVE__ || !container) return;
  const settings = (settingsFeature as SettingsFeature).getService().get();
  if (!shouldRunOnPage(settings)) return;
  transitioning = true;
  try {
    await startProductFeatures(container);
    container.bus.emit(EVENTS.SETTINGS_CHANGED, { settings });
    await persistActive(true);
  } finally {
    transitioning = false;
  }
}

async function handleReset(): Promise<void> {
  if (!container || !window.__DASTRESA_ACTIVE__) return;

  container.bus.emit(EVENTS.TOOLBAR_COMMAND, { command: 'stop' });

  const reader = container.registry.get(FEATURE_IDS.READER_MODE);
  if (reader?.isEnabled()) await reader.disable();

  const focus = container.registry.get(FEATURE_IDS.READING_FOCUS);
  if (focus?.isEnabled()) await focus.disable();

  clearPageArtifacts(document);

  const current = (settingsFeature as SettingsFeature).getService().get();
  const reset = createPageResetSettings(current);

  try {
    await (settingsFeature as SettingsFeature).getService().replace(reset);
  } catch {
    await container.storage.set(STORAGE_KEYS.SETTINGS, reset);
    container.bus.emit(EVENTS.SETTINGS_CHANGED, { settings: reset });
  }

  const themes = container.registry.get(FEATURE_IDS.THEMES);
  const zoom = container.registry.get(FEATURE_IDS.SMART_ZOOM);
  await themes?.disable();
  await zoom?.disable();
  container.bus.emit(EVENTS.SETTINGS_CHANGED, { settings: reset });
  await themes?.enable();
  await zoom?.enable();
}

async function syncActiveState(next: DastresaSettings): Promise<void> {
  if (transitioning) return;
  const shouldRun = shouldRunOnPage(next);
  if (shouldRun && !window.__DASTRESA_ACTIVE__) {
    await handleActivate();
    return;
  }
  if (!shouldRun && window.__DASTRESA_ACTIVE__) {
    if (!next.extensionActive) await handleExit();
    else await handleSiteDeactivate();
  }
}

async function boot(): Promise<void> {
  if (window.__DASTRESA_BOOTED__) return;
  window.__DASTRESA_BOOTED__ = true;

  const storage = createChromeStorage();
  container = createContainer(storage);
  const ctx = container.createFeatureContext();

  await ensureRegistered(container, storageFeature);
  await ensureRegistered(container, settingsFeature);
  await storageFeature.initialize(ctx);
  await settingsFeature.initialize(ctx);

  const settings = (settingsFeature as SettingsFeature).getService().get();

  container.bus.on(EVENTS.TOOLBAR_COMMAND, ({ command }) => {
    if (command === 'exit') {
      void handleExit();
    }
    if (command === 'reset') {
      void handleReset();
    }
  });

  container.bus.on(EVENTS.TOOLBAR_MOVED, ({ x, y }) => {
    void (async () => {
      const raw = await storage.get<unknown>(STORAGE_KEYS.SETTINGS);
      const next = parseSettings(raw);
      await storage.set(STORAGE_KEYS.SETTINGS, {
        ...next,
        toolbarPosition: { x, y },
      });
    })();
  });

  container.bus.on(EVENTS.SETTINGS_CHANGED, ({ settings: next }) => {
    void syncActiveState(next);
  });

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === 'dastresa-exit') {
      void handleExit().then(() => sendResponse({ ok: true }));
      return true;
    }
    if (message?.type === 'dastresa-activate') {
      void handleActivate().then(() => sendResponse({ ok: true }));
      return true;
    }
    if (message?.type === 'dastresa-reset') {
      void handleReset().then(() => sendResponse({ ok: true }));
      return true;
    }
    if (message?.type === 'dastresa-apply-settings') {
      void (async () => {
        if (!container) {
          sendResponse({ ok: false });
          return;
        }
        const next = parseSettings(message.settings);
        try {
          await (settingsFeature as SettingsFeature).getService().replace(next);
        } catch {
          await container.storage.set(STORAGE_KEYS.SETTINGS, next);
          container.bus.emit(EVENTS.SETTINGS_CHANGED, { settings: next });
        }

        await syncActiveState(next);

        const focus = container.registry.get(FEATURE_IDS.READING_FOCUS);
        if (next.readingFocus && window.__DASTRESA_ACTIVE__) {
          if (focus && !focus.isEnabled()) await focus.enable();
        } else if (focus?.isEnabled()) {
          await focus.disable();
        }

        sendResponse({ ok: true });
      })();
      return true;
    }
    return false;
  });

  if (shouldRunOnPage(settings)) {
    await startProductFeatures(container);
    container.bus.emit(EVENTS.SETTINGS_CHANGED, { settings });
  }
}

void boot();
