import { STORAGE_KEYS } from '@/core/constants';

export type DastresaSecrets = {
  /** User Luma API key */
  lumaApiKey?: string;
  /** User Google Gemini API key */
  geminiApiKey?: string;
  /** @deprecated migrated to lumaApiKey */
  summaryApiKey?: string;
};

export async function readSecrets(): Promise<DastresaSecrets> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.SECRETS);
    const raw = result[STORAGE_KEYS.SECRETS];
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
    const data = raw as DastresaSecrets;
    const luma =
      (typeof data.lumaApiKey === 'string' && data.lumaApiKey.trim()) ||
      (typeof data.summaryApiKey === 'string' && data.summaryApiKey.trim()) ||
      undefined;
    const gemini =
      (typeof data.geminiApiKey === 'string' && data.geminiApiKey.trim()) || undefined;
    return {
      lumaApiKey: luma,
      geminiApiKey: gemini,
    };
  } catch {
    return {};
  }
}

export async function writeSecrets(partial: DastresaSecrets): Promise<DastresaSecrets> {
  const current = await readSecrets();
  const next: DastresaSecrets = { ...current };

  if (partial.lumaApiKey !== undefined) {
    next.lumaApiKey = partial.lumaApiKey.trim() || undefined;
  } else if (partial.summaryApiKey !== undefined) {
    next.lumaApiKey = partial.summaryApiKey.trim() || undefined;
  }

  if (partial.geminiApiKey !== undefined) {
    next.geminiApiKey = partial.geminiApiKey.trim() || undefined;
  }

  delete next.summaryApiKey;
  await chrome.storage.local.set({ [STORAGE_KEYS.SECRETS]: next });
  return next;
}
