import { StrictMode, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  openOnboardingPage,
  shouldShowOnboarding,
  markOnboardingComplete,
} from '@/features/onboarding/onboarding-storage';
import { SettingsForm } from '@/features/settings/components/SettingsForm';
import { isSiteDisabled, withSiteDisabled } from '@/core/settings';
import { useSettingsStore } from '@/shared/hooks/useSettingsStore';
import { notifyActiveTab } from '@/shared/messaging/tab';
import { t } from '@/shared/i18n/messages';
import { PublisherCredit, Switch } from '@/shared/ui';
import '@/shared/styles/globals.css';
import './popup.css';

function syncDocumentLang(locale: 'en' | 'fa', dir: 'ltr' | 'rtl') {
  document.documentElement.lang = locale;
  document.documentElement.dir = dir;
}

function LightningIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-6 shrink-0" fill="currentColor">
      <path d="M13 2 4 14h6l-1 8 10-14h-6l0-6z" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="size-5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function PopupApp() {
  const { settings, hydrated, hydrate, update, replace } = useSettingsStore();
  const [busy, setBusy] = useState(false);
  const [hostname, setHostname] = useState('');
  const [showTourCta, setShowTourCta] = useState(false);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    syncDocumentLang(settings.locale === 'en' ? 'en' : 'fa', settings.dir);
    document.documentElement.classList.add('popup-light');
    document.body.style.background = '#f1f5f9';
    return () => {
      document.documentElement.classList.remove('popup-light');
      document.body.style.background = '';
    };
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

  useEffect(() => {
    void shouldShowOnboarding().then(setShowTourCta);
  }, []);

  const locale = settings.locale === 'en' ? 'en' : 'fa';
  const siteOff = useMemo(
    () => (hostname ? isSiteDisabled(settings, hostname) : false),
    [hostname, settings],
  );
  const activeHere = settings.extensionActive && !siteOff;

  const exitNow = async () => {
    setBusy(true);
    try {
      await update({ extensionActive: false, readerMode: false, readingFocus: false });
      await notifyActiveTab('dastresa-exit');
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
      await notifyActiveTab('dastresa-apply-settings', { settings: next });
    } finally {
      setBusy(false);
    }
  };

  const toggleMaster = async (checked: boolean) => {
    if (checked) await enableNow();
    else await exitNow();
  };

  const toggleSite = async () => {
    if (!hostname) return;
    setBusy(true);
    try {
      const next = withSiteDisabled(settings, hostname, !siteOff);
      await replace(next);
      await notifyActiveTab('dastresa-apply-settings', { settings: next });
    } finally {
      setBusy(false);
    }
  };

  const openTour = async () => {
    await openOnboardingPage();
    window.close();
  };

  const dismissTourCta = async () => {
    await markOnboardingComplete(true);
    setShowTourCta(false);
  };

  return (
    <main className="dastresa-popup" dir={settings.dir} lang={locale} aria-busy={busy}>
      <header className="pop-header">
        <div className="pop-top">
          <div className="pop-brand-block">
            <p className="pop-eyebrow">{t(locale, 'accessibility')}</p>
            <h1 className="pop-brand">{t(locale, 'brand')}</h1>
          </div>
          {hydrated ? (
            <div className="pop-switch">
              <Switch
                checked={settings.extensionActive}
                onCheckedChange={(checked) => void toggleMaster(checked)}
                disabled={busy}
                aria-label={t(locale, 'masterToggle')}
              />
            </div>
          ) : null}
        </div>
        <p className="pop-tagline">{t(locale, 'tagline')}</p>

        {busy ? (
          <p className="sr-only" role="status" aria-live="polite">
            {t(locale, 'working')}
          </p>
        ) : null}

        {hydrated && showTourCta ? (
          <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-3.5">
            <p className="text-base font-semibold text-blue-900">{t(locale, 'tourTitle')}</p>
            <div className="pop-row mt-3">
              <button type="button" className="pop-cta" onClick={() => void openTour()}>
                {t(locale, 'tourPopupCta')}
              </button>
              <button
                type="button"
                className="pop-secondary"
                onClick={() => void dismissTourCta()}
              >
                {t(locale, 'tourPopupDismiss')}
              </button>
            </div>
          </div>
        ) : null}

        {hydrated ? (
          <div className="pop-actions">
            {!settings.extensionActive ? (
              <button
                type="button"
                className="pop-cta"
                disabled={busy}
                onClick={() => void enableNow()}
              >
                <LightningIcon />
                <span>{t(locale, 'enableInstant')}</span>
              </button>
            ) : (
              <>
                <p role="status" className="pop-status">
                  {activeHere ? t(locale, 'activeOnPage') : t(locale, 'siteDisabledHint')}
                </p>
                <div className="pop-row">
                  {hostname ? (
                    <button
                      type="button"
                      className="pop-secondary"
                      disabled={busy}
                      onClick={() => void toggleSite()}
                    >
                      {siteOff ? t(locale, 'enableThisSite') : t(locale, 'disableThisSite')}
                    </button>
                  ) : (
                    <span />
                  )}
                  <button
                    type="button"
                    className="pop-danger"
                    disabled={busy}
                    onClick={() => void exitNow()}
                  >
                    {t(locale, 'turnOff')}
                  </button>
                </div>
              </>
            )}
            <p className="pop-hint">{t(locale, 'instantApply')}</p>
          </div>
        ) : null}
      </header>

      <div className="pop-body">
        <SettingsForm compact />
        <button
          type="button"
          className="pop-footer-btn"
          onClick={() => chrome.runtime.openOptionsPage()}
        >
          <GearIcon />
          <span>{t(locale, 'openFullSettings')}</span>
        </button>
        <PublisherCredit locale={locale} compact className="!text-slate-500" />
      </div>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PopupApp />
  </StrictMode>,
);
