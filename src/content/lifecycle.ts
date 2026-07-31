import type { AppContainer } from '@/core/di';
import { EVENTS, FEATURE_IDS, STORAGE_KEYS } from '@/core/constants';
import type { IFeature } from '@/core/contracts';
import {
  createPageResetSettings,
  isSiteDisabled,
  parseSettings,
  type DastresaSettings,
} from '@/core/settings';
import type { SettingsFeature } from '@/features/settings';
import { feature as settingsFeature } from '@/features/settings';
import { feature as domAnalyzerFeature } from '@/features/dom-analyzer';
import { feature as smartZoomFeature } from '@/features/smart-zoom';
import { feature as themesFeature } from '@/features/themes';
import { feature as toolbarFeature } from '@/features/toolbar';
import { feature as readerModeFeature } from '@/features/reader-mode';
import { feature as textToSpeechFeature } from '@/features/text-to-speech';
import { feature as readingFocusFeature } from '@/features/reading-focus';

export type ContentRuntime = {
  container: AppContainer;
  productFeatures: IFeature[];
  transitioning: boolean;
};

declare global {
  interface Window {
    __DASTRESA_BOOTED__?: boolean;
    __DASTRESA_ACTIVE__?: boolean;
  }
}

export function createRuntime(container: AppContainer): ContentRuntime {
  return { container, productFeatures: [], transitioning: false };
}

export function pageHostname(): string {
  try {
    return window.location.hostname.toLowerCase();
  } catch {
    return '';
  }
}

export function shouldRunOnPage(settings: DastresaSettings): boolean {
  return settings.extensionActive && !isSiteDisabled(settings, pageHostname());
}

export function clearPageArtifacts(doc: Document): void {
  doc.querySelectorAll('[data-Dastresa-speech]').forEach((el) => {
    el.removeAttribute('data-Dastresa-speech');
  });
  doc.querySelectorAll('[data-Dastresa-focus]').forEach((el) => {
    el.removeAttribute('data-Dastresa-focus');
  });
  // Canonical id is Dastresa-ruler; keep legacy lowercase cleanup for old sessions.
  doc.getElementById('Dastresa-ruler')?.remove();
  doc.getElementById('dastresa-ruler')?.remove();
  doc.getElementById('Dastresa-cursor-halo')?.remove();
  doc.getElementById('Dastresa-focus-cursor')?.remove();
  doc.documentElement.classList.remove('dastresa-focus-cursor-on');
}

export function settingsService() {
  return (settingsFeature as SettingsFeature).getService();
}

export async function ensureRegistered(app: AppContainer, feature: IFeature): Promise<void> {
  if (!app.registry.get(feature.id)) {
    app.registry.register(feature);
  }
}

export async function shutdown(runtime: ContentRuntime): Promise<void> {
  for (const feature of [...runtime.productFeatures].reverse()) {
    try {
      await feature.disable();
      await feature.dispose();
    } catch (error) {
      console.error('[Dastresa] Failed to shut down feature', feature.id, error);
    }
  }
  runtime.productFeatures = [];
  clearPageArtifacts(document);
  window.__DASTRESA_ACTIVE__ = false;
  runtime.container.bus.emit(EVENTS.EXTENSION_EXITED, undefined);
}

export async function startProductFeatures(runtime: ContentRuntime): Promise<void> {
  const { container } = runtime;
  const ctx = container.createFeatureContext();
  // Static imports only — Vite dynamic import()/modulepreload resolves as
  // "/assets/..." on the *page* origin and breaks content scripts.
  const critical = [domAnalyzerFeature, themesFeature, smartZoomFeature, toolbarFeature];

  runtime.productFeatures = [];

  for (const feature of critical) {
    await ensureRegistered(container, feature);
    await feature.initialize(ctx);
    await feature.enable();
    runtime.productFeatures.push(feature);
  }

  await ensureRegistered(container, readerModeFeature);
  await readerModeFeature.initialize(ctx);
  runtime.productFeatures.push(readerModeFeature);

  await ensureRegistered(container, textToSpeechFeature);
  await textToSpeechFeature.initialize(ctx);
  await textToSpeechFeature.enable();
  runtime.productFeatures.push(textToSpeechFeature);

  await ensureRegistered(container, readingFocusFeature);
  await readingFocusFeature.initialize(ctx);
  runtime.productFeatures.push(readingFocusFeature);

  window.__DASTRESA_ACTIVE__ = true;
  container.bus.emit(EVENTS.EXTENSION_ACTIVATED, undefined);
}

async function persistActive(active: boolean): Promise<void> {
  const current = settingsService().get();
  await settingsService().update({
    extensionActive: active,
    readerMode: active ? current.readerMode : false,
    readingFocus: active ? current.readingFocus : false,
  });
}

export async function handleExit(runtime: ContentRuntime): Promise<void> {
  if (runtime.transitioning || !window.__DASTRESA_ACTIVE__) return;
  runtime.transitioning = true;
  try {
    await shutdown(runtime);
    await persistActive(false);
  } finally {
    runtime.transitioning = false;
  }
}

/** Stop on this page only (global switch stays on; site is in disabledSites). */
export async function handleSiteDeactivate(runtime: ContentRuntime): Promise<void> {
  if (runtime.transitioning || !window.__DASTRESA_ACTIVE__) return;
  runtime.transitioning = true;
  try {
    await shutdown(runtime);
  } finally {
    runtime.transitioning = false;
  }
}

export async function handleActivate(runtime: ContentRuntime): Promise<void> {
  if (runtime.transitioning || window.__DASTRESA_ACTIVE__) return;
  const settings = settingsService().get();
  if (!shouldRunOnPage(settings)) return;
  runtime.transitioning = true;
  try {
    await startProductFeatures(runtime);
    runtime.container.bus.emit(EVENTS.SETTINGS_CHANGED, { settings });
    await persistActive(true);
  } finally {
    runtime.transitioning = false;
  }
}

export async function handleReset(runtime: ContentRuntime): Promise<void> {
  if (!window.__DASTRESA_ACTIVE__) return;
  const { container } = runtime;

  container.bus.emit(EVENTS.TOOLBAR_COMMAND, { command: 'stop' });

  const reader = container.registry.get(FEATURE_IDS.READER_MODE);
  if (reader?.isEnabled()) await reader.disable();

  const focus = container.registry.get(FEATURE_IDS.READING_FOCUS);
  if (focus?.isEnabled()) await focus.disable();

  clearPageArtifacts(document);

  const current = settingsService().get();
  const reset = createPageResetSettings(current);

  try {
    await settingsService().replace(reset);
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

export async function syncActiveState(
  runtime: ContentRuntime,
  next: DastresaSettings,
): Promise<void> {
  if (runtime.transitioning) return;
  const shouldRun = shouldRunOnPage(next);
  if (shouldRun && !window.__DASTRESA_ACTIVE__) {
    await handleActivate(runtime);
    return;
  }
  if (!shouldRun && window.__DASTRESA_ACTIVE__) {
    if (!next.extensionActive) await handleExit(runtime);
    else await handleSiteDeactivate(runtime);
  }
}

export async function applySettingsFromMessage(
  runtime: ContentRuntime,
  raw: unknown,
): Promise<boolean> {
  const next = parseSettings(raw);
  try {
    await settingsService().replace(next);
  } catch {
    await runtime.container.storage.set(STORAGE_KEYS.SETTINGS, next);
    runtime.container.bus.emit(EVENTS.SETTINGS_CHANGED, { settings: next });
  }

  await syncActiveState(runtime, next);

  const focus = runtime.container.registry.get(FEATURE_IDS.READING_FOCUS);
  if (next.readingFocus && window.__DASTRESA_ACTIVE__) {
    if (focus && !focus.isEnabled()) await focus.enable();
  } else if (focus?.isEnabled()) {
    await focus.disable();
  }

  return true;
}
