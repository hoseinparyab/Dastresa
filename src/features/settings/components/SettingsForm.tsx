import { Controller, useWatch } from 'react-hook-form';
import {
  createPageResetSettings,
  type DastresaSettings,
} from '@/features/settings/schema/settings-schema';
import { FOCUS_CURSOR_PALETTE } from '@/features/reading-focus/cursor';
import { useInstantSettings } from '@/shared/hooks/useInstantSettings';
import { Button, Section, SelectField, SwitchRow } from '@/shared/ui';

const THEME_OPTIONS: Array<{ value: DastresaSettings['theme']; label: string }> = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
  { value: 'normal', label: 'Normal (browser)' },
  { value: 'high-contrast', label: 'High Contrast' },
  { value: 'black-white', label: 'Black / White' },
  { value: 'yellow-black', label: 'Yellow / Black' },
];

const CURSOR_COLOR_OPTIONS = (
  Object.entries(FOCUS_CURSOR_PALETTE) as Array<
    [DastresaSettings['focusCursorColor'], (typeof FOCUS_CURSOR_PALETTE)['yellow']]
  >
).map(([value, meta]) => ({ value, label: meta.label }));

export function SettingsForm({ compact = false }: { compact?: boolean }) {
  const { form, settings, hydrated, replace, applyNow, applyDebounced } = useInstantSettings();
  const textScale = useWatch({ control: form.control, name: 'zoom.textScale' });
  const speechRate = useWatch({ control: form.control, name: 'speech.rate' });
  const theme = useWatch({ control: form.control, name: 'theme' });
  const locale = useWatch({ control: form.control, name: 'locale' });
  const focusCursorColor = useWatch({ control: form.control, name: 'focusCursorColor' });

  if (!hydrated) {
    return (
      <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-6 text-sm text-dastresa-muted">
        Loading settings…
      </p>
    );
  }

  return (
    <form className="flex flex-col gap-3" dir={settings.dir} onSubmit={(e) => e.preventDefault()}>
      <p className="rounded-xl bg-sky-500/10 px-3 py-2 text-xs font-medium text-sky-100 ring-1 ring-sky-400/20">
        Changes apply instantly to the open page.
      </p>

      {!compact && (
        <Section title="General" description="Turn Dastresa on or off for this browser.">
          <Controller
            name="extensionActive"
            control={form.control}
            render={({ field }) => (
              <SwitchRow
                id="extensionActive"
                label="Enable Dastresa"
                description="فعال‌سازی دسترسا"
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

      <Section title="Look" description="Pick a comfortable page appearance.">
        <SelectField
          label="Theme"
          value={theme}
          onChange={(e) => {
            applyNow({ theme: e.target.value as DastresaSettings['theme'] });
          }}
        >
          {THEME_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </SelectField>
      </Section>

      <Section title="Reading" description="Tools that make long pages easier to follow.">
        <Controller
          name="readerMode"
          control={form.control}
          render={({ field }) => (
            <SwitchRow
              id="readerMode"
              label="Reader Mode"
              description="Clean article view"
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
              label="Reading Focus"
              description="Must be ON for the colored cursor + halo"
              checked={field.value}
              onCheckedChange={(checked) => {
                field.onChange(checked);
                applyNow({ readingFocus: checked });
              }}
            />
          )}
        />
        <SelectField
          label="Focus cursor color"
          value={focusCursorColor}
          onChange={(e) => {
            applyNow({
              focusCursorColor: e.target.value as DastresaSettings['focusCursorColor'],
              // Turning the cursor color on also enables Focus so the change is visible.
              readingFocus: true,
            });
          }}
        >
          {CURSOR_COLOR_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </SelectField>
        <Controller
          name="readingRuler"
          control={form.control}
          render={({ field }) => (
            <SwitchRow
              id="readingRuler"
              label="Reading Ruler"
              description="Highlight the current line (also turns Focus on)"
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
        {!compact && (
          <>
            <Controller
              name="largeCursor"
              control={form.control}
              render={({ field }) => (
                <SwitchRow
                  id="largeCursor"
                  label="Large Cursor"
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(checked);
                    applyNow({ largeCursor: checked });
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
                  label="Large Buttons"
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(checked);
                    applyNow({ largeButtons: checked });
                  }}
                />
              )}
            />
          </>
        )}
      </Section>

      {!compact && (
        <Section title="Text & speech" description="Fine-tune size and speaking speed.">
          <label className="block px-1 py-2">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
              Text size ({textScale})
            </span>
            <input
              type="range"
              min={0.8}
              max={2.5}
              step={0.05}
              className="w-full accent-dastresa-accent"
              value={textScale ?? 1.15}
              onChange={(e) => {
                form.setValue('zoom.textScale', Number(e.target.value), { shouldDirty: true });
                applyDebounced();
              }}
            />
          </label>
          <label className="block px-1 py-2">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
              Speech rate ({speechRate})
            </span>
            <input
              type="range"
              min={0.5}
              max={2}
              step={0.05}
              className="w-full accent-dastresa-accent"
              value={speechRate ?? 1}
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
                label="Prefer Persian voices"
                checked={field.value}
                onCheckedChange={(checked) => {
                  field.onChange(checked);
                  applyNow({ speech: { ...form.getValues().speech, preferPersian: checked } });
                }}
              />
            )}
          />
          <SelectField
            label="Language"
            value={locale}
            onChange={(e) => {
              const nextLocale = e.target.value as 'en' | 'fa';
              applyNow({ locale: nextLocale, dir: nextLocale === 'fa' ? 'rtl' : 'ltr' });
            }}
          >
            <option value="en">English</option>
            <option value="fa">فارسی</option>
          </SelectField>
        </Section>
      )}

      {!compact && (
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => {
            void (async () => {
              const reset = createPageResetSettings();
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
          Reset page defaults / ریست پیش‌فرض
        </Button>
      )}
    </form>
  );
}
