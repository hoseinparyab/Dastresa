import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SettingsForm } from '@/features/settings/components/SettingsForm';
import '@/shared/styles/globals.css';

function OptionsApp() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
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
          Dastresa
        </p>
        <h1 className="relative mt-2 font-display text-4xl font-bold tracking-tight">
          Accessibility Settings
        </h1>
        <p className="relative mt-3 max-w-xl text-base text-dastresa-muted">
          Everything runs locally in your browser. No cloud. No tracking. Changes apply instantly.
        </p>
      </header>
      <SettingsForm />
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <OptionsApp />
  </StrictMode>,
);
