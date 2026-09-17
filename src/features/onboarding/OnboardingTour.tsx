import { useCallback, useEffect, useId, useState } from 'react';
import { TOUR_STEPS } from '@/features/onboarding/tour-steps';
import { TourStepVisual } from '@/features/onboarding/TourStepVisual';
import { markOnboardingComplete } from '@/features/onboarding/onboarding-storage';
import type { UiChrome } from '@/core/settings';
import { t, tFormat, type AppLocale } from '@/shared/i18n/messages';
import { ChromeToggle, PublisherCredit } from '@/shared/ui';

type Props = {
  locale: AppLocale;
  dir: 'ltr' | 'rtl';
  uiChrome: UiChrome;
  onLocaleChange: (locale: AppLocale) => void;
  onUiChromeChange: (chrome: UiChrome) => void;
};

export function OnboardingTour({
  locale,
  dir,
  uiChrome,
  onLocaleChange,
  onUiChromeChange,
}: Props) {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const titleId = useId();
  const total = TOUR_STEPS.length;
  const current = TOUR_STEPS[step]!;
  const isFirst = step === 0;
  const isLast = step === total - 1;
  const chrome = uiChrome === 'dark' ? 'dark' : 'light';

  const finish = useCallback(async (skipped: boolean) => {
    setBusy(true);
    try {
      await markOnboardingComplete(skipped);
      setDone(true);
      window.close();
    } catch {
      setDone(true);
    } finally {
      setBusy(false);
    }
  }, []);

  const goNext = useCallback(() => {
    if (isLast) {
      void finish(false);
      return;
    }
    setStep((s) => Math.min(s + 1, total - 1));
  }, [finish, isLast, total]);

  const goBack = useCallback(() => {
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (done) return;
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        if (dir === 'rtl') goBack();
        else goNext();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        if (dir === 'rtl') goNext();
        else goBack();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        void finish(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dir, done, finish, goBack, goNext]);

  if (done) {
    return (
      <main className="dastresa-tour" data-chrome={chrome} dir={dir} lang={locale}>
        <div className="tour-shell-inner tour-done">
          <TourStepVisual stepId="ready" />
          <h1 className="tour-title" style={{ fontSize: '1.75rem' }}>
            {t(locale, 'tourStep6Title')}
          </h1>
          <p className="tour-body">{t(locale, 'tourStep6Body')}</p>
          <PublisherCredit locale={locale} className="tour-credit" />
        </div>
      </main>
    );
  }

  return (
    <main
      className="dastresa-tour"
      data-chrome={chrome}
      dir={dir}
      lang={locale}
      aria-labelledby={titleId}
    >
      <div className="tour-shell-inner">
        <header className="tour-header">
          <div className="tour-top">
            <div className="tour-brand-block">
              <p className="tour-eyebrow">{t(locale, 'accessibility')}</p>
              <h1 id={titleId} className="tour-brand">
                {t(locale, 'tourTitle')}
              </h1>
            </div>
            <div className="tour-controls">
              <div className="tour-lang" role="group" aria-label={t(locale, 'language')}>
                {(['fa', 'en'] as const).map((code) => (
                  <button
                    key={code}
                    type="button"
                    className={`tour-lang-btn${locale === code ? ' is-active' : ''}`}
                    aria-pressed={locale === code}
                    onClick={() => onLocaleChange(code)}
                  >
                    {code.toUpperCase()}
                  </button>
                ))}
              </div>
              <ChromeToggle
                value={chrome}
                onChange={onUiChromeChange}
                lightLabel={t(locale, 'chromeLight')}
                darkLabel={t(locale, 'chromeDark')}
              />
            </div>
          </div>
          <p className="tour-tagline">{t(locale, 'brand')}</p>
        </header>

        <section className="tour-card" aria-live="polite">
          <TourStepVisual stepId={current.id} />

          <p className="tour-progress">
            {tFormat(locale, 'tourProgress', { current: step + 1, total })}
          </p>
          <h2 className="tour-title">{t(locale, current.titleKey)}</h2>
          <p className="tour-body">{t(locale, current.bodyKey)}</p>

          <div
            className="tour-dots"
            role="tablist"
            aria-label={t(locale, 'tourTitle')}
          >
            {TOUR_STEPS.map((item, index) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={index === step}
                aria-label={tFormat(locale, 'tourProgress', {
                  current: index + 1,
                  total,
                })}
                className={`tour-dot${index === step ? ' is-active' : ''}`}
                onClick={() => setStep(index)}
              />
            ))}
          </div>
        </section>

        <div className="tour-actions">
          <button
            type="button"
            className="tour-ghost"
            disabled={busy || isFirst}
            onClick={goBack}
          >
            {t(locale, 'tourBack')}
          </button>

          <div className="tour-actions-end">
            <button
              type="button"
              className="tour-cta"
              disabled={busy}
              onClick={goNext}
            >
              {isLast ? t(locale, 'tourFinish') : t(locale, 'tourNext')}
            </button>
            <button
              type="button"
              className="tour-secondary"
              disabled={busy}
              onClick={() => void finish(true)}
            >
              {t(locale, 'tourSkip')}
            </button>
          </div>
        </div>

        <PublisherCredit locale={locale} className="tour-credit" />
      </div>
    </main>
  );
}
