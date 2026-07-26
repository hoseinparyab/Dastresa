import { useCallback, useEffect, useId, useState } from 'react';
import { TOUR_STEPS } from '@/features/onboarding/tour-steps';
import { TourStepVisual } from '@/features/onboarding/TourStepVisual';
import {
  markOnboardingComplete,
} from '@/features/onboarding/onboarding-storage';
import { t, tFormat, type AppLocale } from '@/shared/i18n/messages';
import { Button, PublisherCredit } from '@/shared/ui';
import { cn } from '@/shared/ui/cn';

type Props = {
  locale: AppLocale;
  dir: 'ltr' | 'rtl';
  onLocaleChange: (locale: AppLocale) => void;
};

export function OnboardingTour({ locale, dir, onLocaleChange }: Props) {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const titleId = useId();
  const total = TOUR_STEPS.length;
  const current = TOUR_STEPS[step]!;
  const isFirst = step === 0;
  const isLast = step === total - 1;

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
      <main
        className="mx-auto flex min-h-full max-w-xl flex-col items-center justify-center px-5 py-16 text-center"
        dir={dir}
        lang={locale}
      >
        <TourStepVisual stepId="ready" className="mb-6" />
        <h1 className="font-display text-3xl font-bold tracking-tight">{t(locale, 'tourStep6Title')}</h1>
        <p className="mt-3 max-w-md text-base leading-relaxed text-slate-300">
          {t(locale, 'tourStep6Body')}
        </p>
        <PublisherCredit locale={locale} className="mt-10 w-full" />
      </main>
    );
  }

  return (
    <main
      className="mx-auto flex min-h-full max-w-xl flex-col px-5 py-10 sm:px-8"
      dir={dir}
      lang={locale}
      aria-labelledby={titleId}
    >
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-sky-300/90">{t(locale, 'accessibility')}</p>
          <h1 id={titleId} className="mt-1 font-display text-3xl font-bold tracking-tight">
            {t(locale, 'tourTitle')}
          </h1>
          <p className="mt-2 text-base text-slate-300">{t(locale, 'brand')}</p>
        </div>
        <div className="flex shrink-0 gap-1 rounded-xl border border-white/10 p-1" role="group" aria-label={t(locale, 'language')}>
          {(['fa', 'en'] as const).map((code) => (
            <button
              key={code}
              type="button"
              className={cn(
                'wp-touch rounded-lg px-3 text-sm font-bold transition-colors duration-fast',
                locale === code
                  ? 'bg-sky-500/25 text-sky-100'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200',
              )}
              aria-pressed={locale === code}
              onClick={() => onLocaleChange(code)}
            >
              {code.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      <section
        className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:p-8"
        aria-live="polite"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -end-16 -top-20 size-56 rounded-full bg-sky-400/15 blur-3xl"
        />
        <TourStepVisual stepId={current.id} className="mb-6" />

        <p className="text-sm font-semibold text-slate-400">
          {tFormat(locale, 'tourProgress', { current: step + 1, total })}
        </p>
        <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-slate-50">
          {t(locale, current.titleKey)}
        </h2>
        <p className="mt-3 text-base leading-relaxed text-slate-300">
          {t(locale, current.bodyKey)}
        </p>

        <div
          className="mt-6 flex justify-center gap-2"
          role="tablist"
          aria-label={t(locale, 'tourTitle')}
        >
          {TOUR_STEPS.map((item, index) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={index === step}
              aria-label={tFormat(locale, 'tourProgress', { current: index + 1, total })}
              className={cn(
                'h-2.5 rounded-full transition-all duration-fast motion-reduce:transition-none',
                index === step ? 'w-8 bg-sky-400' : 'w-2.5 bg-slate-600 hover:bg-slate-500',
              )}
              onClick={() => setStep(index)}
            />
          ))}
        </div>
      </section>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          variant="ghost"
          className="sm:min-w-[7rem]"
          disabled={busy || isFirst}
          onClick={goBack}
        >
          {t(locale, 'tourBack')}
        </Button>

        <div className="flex flex-col gap-3 sm:flex-row-reverse sm:items-center">
          <Button
            variant="primary"
            className="sm:min-w-[11rem]"
            disabled={busy}
            onClick={goNext}
          >
            {isLast ? t(locale, 'tourFinish') : t(locale, 'tourNext')}
          </Button>
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => void finish(true)}
          >
            {t(locale, 'tourSkip')}
          </Button>
        </div>
      </div>

      <PublisherCredit locale={locale} className="mt-10" />
    </main>
  );
}
