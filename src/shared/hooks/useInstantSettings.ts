import { useCallback, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  DastresaSettingsSchema,
  type DastresaSettings,
} from '@/features/settings/schema/settings-schema';
import { useSettingsStore } from '@/shared/hooks/useSettingsStore';

/** Instant-apply settings form wired to chrome.storage. */
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
        await replace(values);
        try {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tab?.id) {
            await chrome.tabs.sendMessage(tab.id, {
              type: 'dastresa-apply-settings',
              settings: values,
            });
          }
        } catch {
          // Content script may be missing on chrome:// pages
        }
      } finally {
        window.setTimeout(() => {
          applying.current = false;
        }, 50);
      }
    },
    [replace],
  );

  const applyNow = useCallback(
    (patch: Partial<DastresaSettings>) => {
      const current = form.getValues();
      const next: DastresaSettings = {
        ...current,
        ...patch,
        zoom: { ...current.zoom, ...(patch.zoom ?? {}) },
        speech: { ...current.speech, ...(patch.speech ?? {}) },
        toolbarPosition: {
          ...current.toolbarPosition,
          ...(patch.toolbarPosition ?? {}),
        },
      };
      form.reset(next);
      void persist(next);
    },
    [form, persist],
  );

  const applyDebounced = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void persist(form.getValues());
    }, 200);
  }, [form, persist]);

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
    replace,
    applyNow,
    applyDebounced,
    persist,
  };
}
