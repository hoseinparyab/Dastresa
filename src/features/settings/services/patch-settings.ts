import type { IStorage } from '@/core/contracts';
import { STORAGE_KEYS } from '@/core/constants';
import {
  mergeSettings,
  parseSettings,
  type DastresaSettings,
} from '@/features/settings/schema/settings-schema';

/** Single write path for feature modules that only have IStorage. */
export async function patchStoredSettings(
  storage: IStorage,
  partial: Partial<DastresaSettings>,
): Promise<DastresaSettings> {
  const raw = await storage.get<unknown>(STORAGE_KEYS.SETTINGS);
  const current = parseSettings(raw);
  const next = mergeSettings(current, partial);
  await storage.set(STORAGE_KEYS.SETTINGS, next);
  return next;
}
