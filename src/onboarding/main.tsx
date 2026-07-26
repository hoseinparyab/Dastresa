import { StrictMode, useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { OnboardingTour } from '@/features/onboarding/OnboardingTour';
import { useSettingsStore } from '@/shared/hooks/useSettingsStore';
import type { AppLocale } from '@/shared/i18n/messages';
import '@/shared/styles/globals.css';

function detectInitialLocale(settingsLocale: string | undefined): AppLocale {
  if (settingsLocale === 'en' || settingsLocale === 'fa') return settingsLocale;
  try {
    const ui = chrome.i18n.getUILanguage().toLowerCase();
    if (ui.startsWith('fa') || ui.startsWith('ar')) return 'fa';
  } catch {
    // ignore
  }
  return 'fa';
}

function OnboardingApp() {
  const { settings, hydrated, hydrate, update } = useSettingsStore();
  const [locale, setLocale] = useState<AppLocale>('fa');

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    setLocale(detectInitialLocale(settings.locale));
  }, [hydrated, settings.locale]);

  useEffect(() => {
    const dir = locale === 'fa' ? 'rtl' : 'ltr';
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
    document.title = locale === 'fa' ? 'آشنایی با دسترسا' : 'Welcome — Dastresa';
  }, [locale]);

  const onLocaleChange = useCallback(
    (next: AppLocale) => {
      setLocale(next);
      void update({ locale: next, dir: next === 'fa' ? 'rtl' : 'ltr' });
    },
    [update],
  );

  if (!hydrated) {
    return (
      <main className="mx-auto max-w-xl px-6 py-16 text-center text-slate-300" dir="rtl" lang="fa">
        Loading…
      </main>
    );
  }

  return (
    <OnboardingTour
      locale={locale}
      dir={locale === 'fa' ? 'rtl' : 'ltr'}
      onLocaleChange={onLocaleChange}
    />
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <OnboardingApp />
  </StrictMode>,
);
