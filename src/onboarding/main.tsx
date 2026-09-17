import { StrictMode, useCallback, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { OnboardingTour } from '@/features/onboarding/OnboardingTour';
import type { UiChrome } from '@/core/settings';
import { useSettingsStore } from '@/shared/hooks/useSettingsStore';
import type { AppLocale } from '@/shared/i18n/messages';
import '@/shared/styles/globals.css';
import './onboarding.css';

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
  const locale = detectInitialLocale(settings.locale);
  const uiChrome: UiChrome = settings.uiChrome === 'dark' ? 'dark' : 'light';

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    const dir = locale === 'fa' ? 'rtl' : 'ltr';
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
    document.documentElement.dataset.chrome = uiChrome;
    document.title = locale === 'fa' ? 'آشنایی با دسترسا' : 'Welcome — Dastresa';
  }, [hydrated, locale, uiChrome]);

  const onLocaleChange = useCallback(
    (next: AppLocale) => {
      void update({ locale: next, dir: next === 'fa' ? 'rtl' : 'ltr' });
    },
    [update],
  );

  const onUiChromeChange = useCallback(
    (next: UiChrome) => {
      void update({ uiChrome: next });
    },
    [update],
  );

  if (!hydrated) {
    return (
      <main
        className="dastresa-tour"
        data-chrome={uiChrome}
        dir="rtl"
        lang="fa"
      >
        <div className="tour-shell-inner" style={{ textAlign: 'center', paddingTop: '3rem' }}>
          <p className="tour-body">…</p>
        </div>
      </main>
    );
  }

  return (
    <OnboardingTour
      locale={locale}
      dir={locale === 'fa' ? 'rtl' : 'ltr'}
      uiChrome={uiChrome}
      onLocaleChange={onLocaleChange}
      onUiChromeChange={onUiChromeChange}
    />
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <OnboardingApp />
  </StrictMode>,
);
