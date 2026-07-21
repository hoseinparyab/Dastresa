import { StrictMode, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { SettingsForm } from '@/features/settings/components/SettingsForm';
import {
  isSiteDisabled,
  withSiteDisabled,
} from '@/features/settings/schema/settings-schema';
import { useSettingsStore } from '@/shared/hooks/useSettingsStore';
import { t } from '@/shared/i18n/messages';
import { ActionToolbar, Button, StatusPill } from '@/shared/ui';
import '@/shared/styles/globals.css';

function syncDocumentLang(locale: 'en' | 'fa', dir: 'ltr' | 'rtl') {
  document.documentElement.lang = locale;
  document.documentElement.dir = dir;
}

function PopupApp() {
  const { settings, hydrated, hydrate, update, replace } = useSettingsStore();
  const [busy, setBusy] = useState(false);
  const [hostname, setHostname] = useState('');

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    syncDocumentLang(settings.locale === 'en' ? 'en' : 'fa', settings.dir);
  }, [hydrated, settings.locale, settings.dir]);

  useEffect(() => {
    void (async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.url) setHostname(new URL(tab.url).hostname.toLowerCase());
      } catch {
        setHostname('');
      }
    })();
  }, []);

  const locale = settings.locale === 'en' ? 'en' : 'fa';
  const siteOff = useMemo(
    () => (hostname ? isSiteDisabled(settings, hostname) : false),
    [hostname, settings],
  );
  const activeHere = settings.extensionActive && !siteOff;

  const notifyTab = async (
    type: 'dastresa-exit' | 'dastresa-activate' | 'dastresa-reset' | 'dastresa-apply-settings',
    payload?: Record<string, unknown>,
  ) => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      try {
        await chrome.tabs.sendMessage(tab.id, { type, ...payload });
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
      const next = hostname
        ? withSiteDisabled({ ...settings, extensionActive: true }, hostname, false)
        : { ...settings, extensionActive: true };
      await replace(next);
      await notifyTab('dastresa-apply-settings', { settings: next });
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

  const toggleSite = async () => {
    if (!hostname) return;
    setBusy(true);
    try {
      const next = withSiteDisabled(settings, hostname, !siteOff);
      await replace(next);
      await notifyTab('dastresa-apply-settings', { settings: next });
    } finally {
      setBusy(false);
    }
  };

  return (
    <main
      className="w-[400px] overflow-hidden text-dastresa-text"
      dir={settings.dir}
      lang={locale}
      aria-busy={busy}
    >
      <header className="relative overflow-hidden border-b border-white/10 px-5 pb-5 pt-5">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(56,189,248,0.18),transparent_55%)]"
        />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-sky-300/90">{t(locale, 'accessibility')}</p>
            <h1 className="mt-1 font-display text-[1.75rem] font-bold leading-none tracking-tight">
              {t(locale, 'brand')}
            </h1>
            <p className="mt-2 text-base text-slate-300">{t(locale, 'tagline')}</p>
          </div>
          {hydrated ? (
            <StatusPill
              active={activeHere}
              activeLabel={t(locale, 'active')}
              inactiveLabel={t(locale, 'off')}
            />
          ) : null}
        </div>

        {hydrated && (
          <div className="relative mt-4 space-y-2">
            {busy ? (
              <p className="sr-only" role="status" aria-live="polite">
                {t(locale, 'working')}
              </p>
            ) : null}
            {settings.extensionActive ? (
              <>
                <ActionToolbar
                  className="w-full"
                  aria-label={t(locale, 'actions')}
                  buttons={[
                    {
                      id: 'reset',
                      label: t(locale, 'resetPage'),
                      onClick: () => void resetNow(),
                      disabled: busy || siteOff,
                    },
                    {
                      id: 'exit',
                      label: t(locale, 'exit'),
                      onClick: () => void exitNow(),
                      danger: true,
                      disabled: busy,
                    },
                  ]}
                />
                {hostname ? (
                  <Button
                    variant="secondary"
                    className="w-full"
                    disabled={busy}
                    onClick={() => void toggleSite()}
                  >
                    {siteOff ? t(locale, 'enableThisSite') : t(locale, 'disableThisSite')}
                  </Button>
                ) : null}
                {siteOff ? (
                  <p className="text-sm text-amber-200">{t(locale, 'siteDisabledHint')}</p>
                ) : null}
              </>
            ) : (
              <Button
                variant="primary"
                className="w-full"
                disabled={busy}
                onClick={() => void enableNow()}
              >
                {t(locale, 'enable')}
              </Button>
            )}
          </div>
        )}
      </header>

      <div className="max-h-[520px] space-y-3 overflow-y-auto p-4">
        <SettingsForm compact />
        <Button variant="ghost" className="w-full" onClick={() => chrome.runtime.openOptionsPage()}>
          {t(locale, 'openFullSettings')}
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
