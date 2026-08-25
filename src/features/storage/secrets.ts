import { STORAGE_KEYS } from '@/core/constants';

export type DastresaSecrets = {
  /** User OpenAI-compatible API key (any provider). */
  summaryApiKey?: string;
  /** @deprecated migrated to summaryApiKey */
  lumaApiKey?: string;
};

export async function readSecrets(): Promise<DastresaSecrets> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.SECRETS);
    const raw = result[STORAGE_KEYS.SECRETS];
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
    const data = raw as DastresaSecrets;
    const key =
      (typeof data.summaryApiKey === 'string' && data.summaryApiKey.trim()) ||
      (typeof data.lumaApiKey === 'string' && data.lumaApiKey.trim()) ||
      undefined;
    return { summaryApiKey: key };
  } catch {
    return {};
  }
}

export async function writeSecrets(partial: DastresaSecrets): Promise<DastresaSecrets> {
  const current = await readSecrets();
  const next: DastresaSecrets = { ...current };
  if (partial.summaryApiKey !== undefined) {
    next.summaryApiKey = partial.summaryApiKey.trim() || undefined;
  } else if (partial.lumaApiKey !== undefined) {
    next.summaryApiKey = partial.lumaApiKey.trim() || undefined;
  }
  delete next.lumaApiKey;
  await chrome.storage.local.set({ [STORAGE_KEYS.SECRETS]: next });
  return next;
}
