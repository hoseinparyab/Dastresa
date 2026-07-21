import type { Unsubscribe } from '@/core/types/events';
import type { IStorage } from '@/core/contracts';

export class ChromeLocalStorage implements IStorage {
  async get<T>(key: string): Promise<T | undefined> {
    const result = await chrome.storage.local.get(key);
    return result[key] as T | undefined;
  }

  async set<T>(key: string, value: T): Promise<void> {
    await chrome.storage.local.set({ [key]: value });
  }

  async delete(key: string): Promise<void> {
    await chrome.storage.local.remove(key);
  }

  watch<T>(key: string, listener: (value: T | undefined) => void): Unsubscribe {
    const handler: Parameters<typeof chrome.storage.onChanged.addListener>[0] = (changes, area) => {
      if (area !== 'local') return;
      if (!(key in changes)) return;
      listener(changes[key]?.newValue as T | undefined);
    };
    chrome.storage.onChanged.addListener(handler);
    return () => chrome.storage.onChanged.removeListener(handler);
  }
}

/** In-memory storage for unit tests and non-extension environments. */
export class MemoryStorage implements IStorage {
  private readonly data = new Map<string, unknown>();
  private readonly listeners = new Map<string, Set<(value: unknown) => void>>();

  async get<T>(key: string): Promise<T | undefined> {
    return this.data.get(key) as T | undefined;
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.data.set(key, value);
    this.listeners.get(key)?.forEach((l) => l(value));
  }

  async delete(key: string): Promise<void> {
    this.data.delete(key);
    this.listeners.get(key)?.forEach((l) => l(undefined));
  }

  watch<T>(key: string, listener: (value: T | undefined) => void): Unsubscribe {
    const set = this.listeners.get(key) ?? new Set();
    const wrapped = (value: unknown) => listener(value as T | undefined);
    set.add(wrapped);
    this.listeners.set(key, set);
    return () => set.delete(wrapped);
  }
}

export function createChromeStorage(): IStorage {
  return new ChromeLocalStorage();
}

export function createMemoryStorage(): IStorage {
  return new MemoryStorage();
}
