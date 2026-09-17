import { useCallback, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  DastresaSettingsSchema,
  mergeSettings,
  parseSettings,
  type DastresaSettings,
} from '@/core/settings';
import { useSettingsStore } from '@/shared/hooks/useSettingsStore';
import { notifyActiveTab } from '@/shared/messaging/tab';

/** Settings that change how the open page looks/behaves. */
function patchAffectsPage(patch: Partial<DastresaSettings>): boolean {
  return (
    patch.theme !== undefined ||
    patch.zoom !== undefined ||
    patch.readerMode !== undefined ||
    patch.readingFocus !== undefined ||
    patch.readingRuler !== undefined ||
    patch.largeButtons !== undefined ||
    patch.largeCursor !== undefined ||
    patch.focusCursorColor !== undefined ||
    patch.activeProfile !== undefined ||
    patch.extensionActive === true
  );
}

/** Instant-apply settings form wired to chrome.storage + active tab. */
export function useInstantSettings() {
  const { settings, hydrated, hydrate, replace } = useSettingsStore();
  const form = useForm<DastresaSettings>({
    resolver: zodResolver(DastresaSettingsSchema) as never,
    defaultValues: settings,
  });
  const applying = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated || applying.current) return;
    form.reset(settings);
  }, [hydrated, settings, form]);

  const persist = useCallback(
    async (values: DastresaSettings) => {
      applying.current = true;
      try {
        const parsed = parseSettings(values);
        form.reset(parsed);
        await replace(parsed);
        // Push to content script so Look/zoom/reader apply without waiting for storage echo.
        await notifyActiveTab('dastresa-apply-settings', { settings: parsed });
        if (parsed.extensionActive) {
          await notifyActiveTab('dastresa-activate');
        }
      } finally {
        window.setTimeout(() => {
          applying.current = false;
        }, 80);
      }
    },
    [form, replace],
  );

  const applyNow = useCallback(
    (patch: Partial<DastresaSettings>) => {
      const current = form.getValues();
      let next = mergeSettings(current, patch);
      // Elderly path: changing Look/reading while off should turn Dastresa on.
      if (patchAffectsPage(patch) && !next.extensionActive) {
        next = mergeSettings(next, { extensionActive: true });
      }
      void persist(next);
    },
    [form, persist],
  );

  const applyDebounced = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const current = form.getValues();
      let next = parseSettings(current);
      if (!next.extensionActive && (current.zoom || current.theme)) {
        next = mergeSettings(next, { extensionActive: true });
      }
      void persist(next);
    }, 200);
  }, [form, persist]);

  const replaceAndApply = useCallback(
    async (next: DastresaSettings) => {
      let parsed = parseSettings(next);
      if (!parsed.extensionActive) {
        parsed = mergeSettings(parsed, { extensionActive: true });
      }
      await persist(parsed);
    },
    [persist],
  );

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );

  return {
    form,
    settings,
    hydrated,
    /** @deprecated Prefer replaceAndApply so the open page updates. */
    replace,
    replaceAndApply,
    applyNow,
    applyDebounced,
    persist,
  };
}
