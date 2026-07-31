import { create } from 'zustand';
import {
  createDefaultSettings,
  mergeSettings,
  parseSettings,
  type DastresaSettings,
} from '@/core/settings';
import { STORAGE_KEYS } from '@/core/constants';

interface SettingsStore {
  settings: DastresaSettings;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  update: (partial: Partial<DastresaSettings>) => Promise<void>;
  replace: (next: DastresaSettings) => Promise<void>;
}

async function readSettings(): Promise<DastresaSettings> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
    return parseSettings(result[STORAGE_KEYS.SETTINGS]);
  } catch {
    return createDefaultSettings();
  }
}

/**
 * Popup/options settings store.
 * Writes full validated settings to chrome.storage.local using the same
 * merge/parse helpers as content-side SettingsService / patchStoredSettings.
 */
export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: createDefaultSettings(),
  hydrated: false,
  hydrate: async () => {
    const settings = await readSettings();
    set({ settings, hydrated: true });
  },
  update: async (partial) => {
    const settings = mergeSettings(get().settings, partial);
    set({ settings });
    await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: settings });
  },
  replace: async (next) => {
    const settings = parseSettings(next);
    set({ settings });
    await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: settings });
  },
}));
