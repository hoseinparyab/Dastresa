import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { SettingsForm } from '@/features/settings/components/SettingsForm';
import { useSettingsStore } from '@/shared/hooks/useSettingsStore';
import { t } from '@/shared/i18n/messages';
import '@/shared/styles/globals.css';

function OptionsApp() {
  const { settings, hydrate } = useSettingsStore();
  const locale = settings.locale === 'en' ? 'en' : 'fa';

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return (
    <main className="mx-auto max-w-2xl px-6 py-10" dir={settings.dir} lang={locale}>
      <header className="relative mb-8 overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-sky-400/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 left-10 size-48 rounded-full bg-cyan-500/10 blur-3xl"
        />
        <p className="relative text-xs font-bold uppercase tracking-[0.22em] text-dastresa-accent">
          دسترسا
        </p>
        <h1 className="relative mt-2 font-display text-4xl font-bold tracking-tight">
          {locale === 'fa' ? 'تنظیمات دسترسی‌پذیری' : 'Accessibility Settings'}
        </h1>
        <p className="relative mt-3 max-w-xl text-base text-dastresa-muted">
          {locale === 'fa'
            ? 'همه‌چیز روی دستگاه شما اجرا می‌شود. بدون ابر. بدون ردیابی. تغییرات فوری اعمال می‌شوند.'
            : 'Everything runs locally in your browser. No cloud. No tracking. Changes apply instantly.'}
        </p>
      </header>
      <SettingsForm />
      <p className="mt-6 text-center text-xs text-slate-500">{t(locale, 'tagline')}</p>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <OptionsApp />
  </StrictMode>,
);
