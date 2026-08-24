import { STORAGE_KEYS } from '@/core/constants';

export type DastresaSecrets = {
  lumaApiKey?: string;
};

export async function readSecrets(): Promise<DastresaSecrets> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.SECRETS);
    const raw = result[STORAGE_KEYS.SECRETS];
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
    const key = (raw as DastresaSecrets).lumaApiKey;
    return { lumaApiKey: typeof key === 'string' ? key.trim() : undefined };
  } catch {
    return {};
  }
}

export async function writeSecrets(partial: DastresaSecrets): Promise<DastresaSecrets> {
  const current = await readSecrets();
  const next: DastresaSecrets = {
    ...current,
    ...partial,
  };
  if (partial.lumaApiKey !== undefined) {
    next.lumaApiKey = partial.lumaApiKey.trim() || undefined;
  }
  await chrome.storage.local.set({ [STORAGE_KEYS.SECRETS]: next });
  return next;
}
