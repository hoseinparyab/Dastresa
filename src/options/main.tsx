import { StrictMode, useCallback, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import type { UiChrome } from '@/core/settings';
import {
  openOnboardingPage,
  resetOnboarding,
} from '@/features/onboarding/onboarding-storage';
import { SettingsForm } from '@/features/settings/components/SettingsForm';
import { useSettingsStore } from '@/shared/hooks/useSettingsStore';
import { t } from '@/shared/i18n/messages';
import { ChromeToggle, PublisherCredit } from '@/shared/ui';
import '@/shared/styles/globals.css';
import './options.css';

function OptionsApp() {
  const { settings, hydrated, hydrate, update } = useSettingsStore();
  const locale = settings.locale === 'en' ? 'en' : 'fa';
  const dir = settings.dir === 'ltr' ? 'ltr' : 'rtl';
  const uiChrome: UiChrome = settings.uiChrome === 'dark' ? 'dark' : 'light';

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
    document.documentElement.dataset.chrome = uiChrome;
    document.title = locale === 'fa' ? 'تنظیمات دسترسا' : 'Dastresa Settings';
  }, [dir, hydrated, locale, uiChrome]);

  const setUiChrome = useCallback(
    (next: UiChrome) => {
      void update({ uiChrome: next });
    },
    [update],
  );

  const replayTour = async () => {
    await resetOnboarding();
    await openOnboardingPage();
  };

  if (!hydrated) {
    return (
      <main className="dastresa-options" data-chrome={uiChrome} dir="rtl" lang="fa">
        <div className="opt-shell">
          <p className="opt-subtitle" style={{ textAlign: 'center', paddingTop: '2.5rem' }}>
            …
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      className="dastresa-options"
      data-chrome={uiChrome}
      dir={dir}
      lang={locale}
    >
      <div className="opt-shell">
        <header className="opt-header">
          <div className="opt-top">
            <div className="opt-brand-block">
              <p className="opt-eyebrow">{t(locale, 'accessibility')}</p>
              <h1 className="opt-title">{t(locale, 'optionsTitle')}</h1>
            </div>
            <div className="opt-controls">
              <ChromeToggle
                value={uiChrome}
                onChange={setUiChrome}
                lightLabel={t(locale, 'chromeLight')}
                darkLabel={t(locale, 'chromeDark')}
              />
            </div>
          </div>
          <p className="opt-subtitle">{t(locale, 'optionsSubtitle')}</p>
          <div className="opt-actions">
            <button
              type="button"
              className="opt-secondary"
              onClick={() => void replayTour()}
            >
              {t(locale, 'tourReplay')}
            </button>
          </div>
        </header>

        <p className="opt-hint">{t(locale, 'instantApply')}</p>

        <SettingsForm />

        <p className="opt-tagline">{t(locale, 'tagline')}</p>
        <PublisherCredit locale={locale} className="opt-credit" />
      </div>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <OptionsApp />
  </StrictMode>,
);
