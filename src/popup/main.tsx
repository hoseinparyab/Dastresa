import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { SettingsForm } from '@/features/settings/components/SettingsForm';
import { useSettingsStore } from '@/shared/hooks/useSettingsStore';
import { ActionToolbar, Button, StatusPill } from '@/shared/ui';
import '@/shared/styles/globals.css';

function PopupApp() {
  const { settings, hydrated, hydrate, update } = useSettingsStore();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const notifyTab = async (type: 'dastresa-exit' | 'dastresa-activate' | 'dastresa-reset') => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      try {
        await chrome.tabs.sendMessage(tab.id, { type });
      } catch {
        // Content script may be missing on chrome:// pages
      }
    }
  };

  const exitNow = async () => {
    setBusy(true);
    try {
      await update({ extensionActive: false, readerMode: false, readingFocus: false });
      await notifyTab('dastresa-exit');
    } finally {
      setBusy(false);
    }
  };

  const enableNow = async () => {
    setBusy(true);
    try {
      await update({ extensionActive: true });
      await notifyTab('dastresa-activate');
    } finally {
      setBusy(false);
    }
  };

  const resetNow = async () => {
    setBusy(true);
    try {
      await notifyTab('dastresa-reset');
      await hydrate();
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="w-[380px] overflow-hidden text-dastresa-text">
      <header className="relative overflow-hidden border-b border-white/10 px-5 pb-5 pt-5">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(56,189,248,0.18),transparent_55%)]"
        />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-sky-300/90">
              Accessibility
            </p>
            <h1 className="mt-1 font-display text-[1.75rem] font-bold leading-none tracking-tight">
              Dastresa
            </h1>
            <p className="mt-2 text-sm text-slate-400">Easier reading. Offline. Private.</p>
          </div>
          {hydrated ? <StatusPill active={settings.extensionActive} /> : null}
        </div>

        {hydrated && (
          <div className="relative mt-4">
            {settings.extensionActive ? (
              <ActionToolbar
                className="w-full"
                buttons={[
                  {
                    id: 'reset',
                    label: 'Reset page',
                    onClick: () => void resetNow(),
                    disabled: busy,
                  },
                  {
                    id: 'exit',
                    label: 'Exit',
                    onClick: () => void exitNow(),
                    danger: true,
                    disabled: busy,
                  },
                ]}
              />
            ) : (
              <Button
                variant="primary"
                className="w-full"
                disabled={busy}
                onClick={() => void enableNow()}
              >
                Enable Dastresa / فعال‌سازی
              </Button>
            )}
          </div>
        )}
      </header>

      <div className="max-h-[460px] space-y-3 overflow-y-auto p-4">
        <SettingsForm compact />
        <Button variant="ghost" className="w-full" onClick={() => chrome.runtime.openOptionsPage()}>
          Open full settings
        </Button>
      </div>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PopupApp />
  </StrictMode>,
);
