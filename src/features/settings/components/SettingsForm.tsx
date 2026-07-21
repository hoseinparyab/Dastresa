import { Controller, useWatch } from 'react-hook-form';
import {
  createPageResetSettings,
  type DastresaSettings,
} from '@/features/settings/schema/settings-schema';
import { useInstantSettings } from '@/shared/hooks/useInstantSettings';
import { t } from '@/shared/i18n/messages';
import { Button, Section, SelectField, SwitchRow } from '@/shared/ui';

const CURSOR_KEYS = {
  sky: 'cursorSky',
  yellow: 'cursorYellow',
  lime: 'cursorLime',
  magenta: 'cursorMagenta',
  white: 'cursorWhite',
} as const;

export function SettingsForm({ compact = false }: { compact?: boolean }) {
  const { form, settings, hydrated, replace, applyNow, applyDebounced } = useInstantSettings();
  const textScale = useWatch({ control: form.control, name: 'zoom.textScale' });
  const speechRate = useWatch({ control: form.control, name: 'speech.rate' });
  const theme = useWatch({ control: form.control, name: 'theme' });
  const localeWatch = useWatch({ control: form.control, name: 'locale' });
  const focusCursorColor = useWatch({ control: form.control, name: 'focusCursorColor' });
  const locale = (localeWatch ?? settings.locale) === 'en' ? 'en' : 'fa';

  const themeOptions: Array<{ value: DastresaSettings['theme']; label: string }> = [
    { value: 'normal', label: t(locale, 'themeNormal') },
    { value: 'dark', label: t(locale, 'themeDark') },
    { value: 'light', label: t(locale, 'themeLight') },
    { value: 'high-contrast', label: t(locale, 'themeHighContrast') },
    { value: 'black-white', label: t(locale, 'themeBlackWhite') },
    { value: 'yellow-black', label: t(locale, 'themeYellowBlack') },
  ];

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
            aria-valuemin={80}
            aria-valuemax={250}
            aria-valuenow={textSizePercent}
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
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => {
            void (async () => {
              const reset = createPageResetSettings(form.getValues());
              form.reset(reset);
              await replace(reset);
              try {
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (tab?.id) {
                  await chrome.tabs.sendMessage(tab.id, { type: 'dastresa-reset' });
                }
              } catch {
                // ignore when not on a web page
              }
            })();
          }}
        >
          {t(locale, 'resetDefaults')}
        </Button>
      )}
    </form>
  );
}
