import { useEffect, useState } from 'react';
import { Controller, useWatch } from 'react-hook-form';
import { LUMA_API } from '@/core/constants';
import { createPageResetSettings, type DastresaSettings } from '@/core/settings';
import { readSecrets, writeSecrets } from '@/features/storage/secrets';
import { useInstantSettings } from '@/shared/hooks/useInstantSettings';
import { notifyActiveTab } from '@/shared/messaging/tab';
import { t } from '@/shared/i18n/messages';
import { Button, Section, SelectField, SwitchRow } from '@/shared/ui';

const CURSOR_KEYS = {
  sky: 'cursorSky',
  yellow: 'cursorYellow',
  lime: 'cursorLime',
  magenta: 'cursorMagenta',
  white: 'cursorWhite',
} as const;

const LUMA_MODELS = [
  'openai/gpt-4o-mini',
  'openai/gpt-4.1-mini',
  'google/gemini-2.5-flash',
  'google/gemini-2.5-flash-lite',
  'anthropic/claude-haiku-4.5',
] as const;

export function SettingsForm({ compact = false }: { compact?: boolean }) {
  const { form, settings, hydrated, replace, applyNow, applyDebounced } = useInstantSettings();
  const textScale = useWatch({ control: form.control, name: 'zoom.textScale' });
  const speechRate = useWatch({ control: form.control, name: 'speech.rate' });
  const theme = useWatch({ control: form.control, name: 'theme' });
  const localeWatch = useWatch({ control: form.control, name: 'locale' });
  const focusCursorColor = useWatch({ control: form.control, name: 'focusCursorColor' });
  const summaryModel = useWatch({ control: form.control, name: 'summaryModel' });
  const locale = (localeWatch ?? settings.locale) === 'en' ? 'en' : 'fa';
  const [apiKeyDraft, setApiKeyDraft] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [keyStatus, setKeyStatus] = useState('');

  const themeOptions: Array<{ value: DastresaSettings['theme']; label: string }> = [
    { value: 'normal', label: t(locale, 'themeNormal') },
    { value: 'dark', label: t(locale, 'themeDark') },
    { value: 'light', label: t(locale, 'themeLight') },
    { value: 'high-contrast', label: t(locale, 'themeHighContrast') },
    { value: 'black-white', label: t(locale, 'themeBlackWhite') },
    { value: 'yellow-black', label: t(locale, 'themeYellowBlack') },
  ];

  useEffect(() => {
    if (compact) return;
    void readSecrets().then((secrets) => {
      setHasApiKey(Boolean(secrets.summaryApiKey));
      setApiKeyDraft('');
    });
  }, [compact]);

  if (!hydrated) {
    return (
      <p
        role="status"
        aria-live="polite"
        className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-6 text-base text-slate-200"
      >
        {t(locale, 'loadingSettings')}
      </p>
    );
  }

  const textSizePercent = Math.round((textScale ?? 1) * 100);

  return (
    <form className="flex flex-col gap-3" dir={settings.dir} onSubmit={(e) => e.preventDefault()}>
      <p className="rounded-xl bg-sky-500/10 px-3 py-2.5 text-sm font-medium leading-snug text-sky-100 ring-1 ring-sky-400/20">
        {t(locale, 'instantApply')}
      </p>

      {!compact && (
        <Section title={t(locale, 'general')} description={t(locale, 'generalDesc')}>
          <Controller
            name="extensionActive"
            control={form.control}
            render={({ field }) => (
              <SwitchRow
                id="extensionActive"
                label={t(locale, 'enable')}
                description={t(locale, 'enableDesc')}
                checked={field.value}
                onCheckedChange={(checked) => {
                  field.onChange(checked);
                  applyNow({ extensionActive: checked });
                }}
              />
            )}
          />
        </Section>
      )}

      <Section title={t(locale, 'look')} description={t(locale, 'lookDesc')}>
        <SelectField
          label={t(locale, 'theme')}
          value={theme}
          onChange={(e) => {
            applyNow({ theme: e.target.value as DastresaSettings['theme'] });
          }}
        >
          {themeOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </SelectField>
      </Section>

      {/* Essential reading tools — always visible (elderly primary path) */}
      <Section title={t(locale, 'reading')} description={t(locale, 'readingDesc')}>
        <label className="block px-1 py-2">
          <span className="mb-2 block text-sm font-semibold text-slate-200">
            {t(locale, 'textSize')} ({textSizePercent}%)
          </span>
          <input
            type="range"
            min={0.8}
            max={2.5}
            step={0.05}
            className="w-full accent-dastresa-accent"
            value={textScale ?? 1}
            aria-valuemin={0.8}
            aria-valuemax={2.5}
            aria-valuenow={textScale ?? 1}
            aria-valuetext={`${textSizePercent}%`}
            aria-label={t(locale, 'textSize')}
            onChange={(e) => {
              form.setValue('zoom.textScale', Number(e.target.value), { shouldDirty: true });
              applyDebounced();
            }}
          />
        </label>

        <SelectField
          label={t(locale, 'language')}
          value={localeWatch}
          onChange={(e) => {
            const nextLocale = e.target.value as 'en' | 'fa';
            applyNow({ locale: nextLocale, dir: nextLocale === 'fa' ? 'rtl' : 'ltr' });
          }}
        >
          <option value="fa">فارسی</option>
          <option value="en">English</option>
        </SelectField>

        <Controller
          name="readerMode"
          control={form.control}
          render={({ field }) => (
            <SwitchRow
              id="readerMode"
              label={t(locale, 'readerMode')}
              description={t(locale, 'readerModeDesc')}
              checked={field.value}
              onCheckedChange={(checked) => {
                field.onChange(checked);
                applyNow({ readerMode: checked });
              }}
            />
          )}
        />
        <Controller
          name="readingFocus"
          control={form.control}
          render={({ field }) => (
            <SwitchRow
              id="readingFocus"
              label={t(locale, 'readingFocus')}
              description={t(locale, 'readingFocusDesc')}
              checked={field.value}
              onCheckedChange={(checked) => {
                field.onChange(checked);
                applyNow({ readingFocus: checked });
              }}
            />
          )}
        />
        <SelectField
          label={t(locale, 'focusCursorColor')}
          value={focusCursorColor}
          onChange={(e) => {
            applyNow({
              focusCursorColor: e.target.value as DastresaSettings['focusCursorColor'],
              readingFocus: true,
            });
          }}
        >
          {(Object.keys(CURSOR_KEYS) as Array<keyof typeof CURSOR_KEYS>).map((value) => (
            <option key={value} value={value}>
              {t(locale, CURSOR_KEYS[value])}
            </option>
          ))}
        </SelectField>
        <Controller
          name="readingRuler"
          control={form.control}
          render={({ field }) => (
            <SwitchRow
              id="readingRuler"
              label={t(locale, 'readingRuler')}
              description={t(locale, 'readingRulerDesc')}
              checked={field.value}
              onCheckedChange={(checked) => {
                field.onChange(checked);
                applyNow(
                  checked ? { readingRuler: true, readingFocus: true } : { readingRuler: false },
                );
              }}
            />
          )}
        />
        <Controller
          name="largeButtons"
          control={form.control}
          render={({ field }) => (
            <SwitchRow
              id="largeButtons"
              label={t(locale, 'largeButtons')}
              checked={field.value}
              onCheckedChange={(checked) => {
                field.onChange(checked);
                applyNow({ largeButtons: checked });
              }}
            />
          )}
        />
        {!compact && (
          <Controller
            name="largeCursor"
            control={form.control}
            render={({ field }) => (
              <SwitchRow
                id="largeCursor"
                label={t(locale, 'largeCursor')}
                checked={field.value}
                onCheckedChange={(checked) => {
                  field.onChange(checked);
                  applyNow({ largeCursor: checked });
                }}
              />
            )}
          />
        )}
      </Section>

      {!compact && (
        <Section title={t(locale, 'textSpeech')} description={t(locale, 'textSpeechDesc')}>
          <label className="block px-1 py-2">
            <span className="mb-2 block text-sm font-semibold text-slate-200">
              {t(locale, 'speechRate')} ({speechRate})
            </span>
            <input
              type="range"
              min={0.5}
              max={2}
              step={0.05}
              className="w-full accent-dastresa-accent"
              value={speechRate ?? 1}
              aria-label={t(locale, 'speechRate')}
              aria-valuetext={String(speechRate ?? 1)}
              onChange={(e) => {
                form.setValue('speech.rate', Number(e.target.value), { shouldDirty: true });
                applyDebounced();
              }}
            />
          </label>
          <Controller
            name="speech.preferPersian"
            control={form.control}
            render={({ field }) => (
              <SwitchRow
                id="preferPersian"
                label={t(locale, 'preferPersian')}
                checked={field.value}
                onCheckedChange={(checked) => {
                  field.onChange(checked);
                  applyNow({ speech: { ...form.getValues().speech, preferPersian: checked } });
                }}
              />
            )}
          />
        </Section>
      )}

      {!compact && (
        <Section title={t(locale, 'summarySection')} description={t(locale, 'summarySectionDesc')}>
          <label className="block px-1 py-2">
            <span className="mb-2 block text-sm font-semibold text-slate-200">
              {t(locale, 'summaryApiKey')}
            </span>
            <p className="mb-2 text-sm text-slate-400">{t(locale, 'summaryApiKeyDesc')}</p>
            <input
              type="password"
              autoComplete="off"
              className="wp-touch w-full rounded-xl border border-white/10 bg-dastresa-surface/90 px-3 text-base text-dastresa-text"
              placeholder={hasApiKey ? '••••••••••••' : 'LU_…'}
              value={apiKeyDraft}
              onChange={(e) => setApiKeyDraft(e.target.value)}
              aria-label={t(locale, 'summaryApiKey')}
            />
          </label>
          <div className="flex flex-wrap gap-2 px-1 py-2">
            <Button
              variant="primary"
              onClick={() => {
                void (async () => {
                  await writeSecrets({ summaryApiKey: apiKeyDraft });
                  setHasApiKey(Boolean(apiKeyDraft.trim()));
                  setApiKeyDraft('');
                  setKeyStatus(t(locale, 'summaryKeySaved'));
                })();
              }}
            >
              {t(locale, 'summarySaveKey')}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                void (async () => {
                  await writeSecrets({ summaryApiKey: '' });
                  setHasApiKey(false);
                  setApiKeyDraft('');
                  setKeyStatus(t(locale, 'summaryKeyCleared'));
                })();
              }}
            >
              {t(locale, 'summaryClearKey')}
            </Button>
          </div>
          {keyStatus ? (
            <p className="px-1 text-sm text-sky-200" role="status">
              {keyStatus}
            </p>
          ) : null}
          {hasApiKey ? (
            <SelectField
              label={t(locale, 'summaryModel')}
              value={summaryModel ?? LUMA_API.DEFAULT_MODEL}
              onChange={(e) => {
                applyNow({ summaryModel: e.target.value });
              }}
            >
              {LUMA_MODELS.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
              {summaryModel &&
              !LUMA_MODELS.includes(summaryModel as (typeof LUMA_MODELS)[number]) ? (
                <option value={summaryModel}>{summaryModel}</option>
              ) : null}
            </SelectField>
          ) : null}
        </Section>
      )}

      {!compact && (
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => {
            void (async () => {
              const reset = createPageResetSettings(form.getValues());
              form.reset(reset);
              await replace(reset);
              await notifyActiveTab('dastresa-reset');
            })();
          }}
        >
          {t(locale, 'resetDefaults')}
        </Button>
      )}
    </form>
  );
}
