import { cn } from '@/shared/ui/cn';
import type { UiChrome } from '@/core/settings';

/** Compact light/dark chrome toggle — pattern adapted from 21st.dev Theme (button variant). */
export function ChromeToggle({
  value,
  onChange,
  lightLabel,
  darkLabel,
  className,
}: {
  value: UiChrome;
  onChange: (next: UiChrome) => void;
  lightLabel: string;
  darkLabel: string;
  className?: string;
}) {
  const isDark = value === 'dark';
  return (
    <div
      role="group"
      aria-label={`${lightLabel} / ${darkLabel}`}
      className={cn('pop-chrome-toggle', className)}
    >
      <button
        type="button"
        className={cn('pop-chrome-btn', !isDark && 'is-active')}
        aria-pressed={!isDark}
        onClick={() => onChange('light')}
      >
        <SunIcon />
        <span>{lightLabel}</span>
      </button>
      <button
        type="button"
        className={cn('pop-chrome-btn', isDark && 'is-active')}
        aria-pressed={isDark}
        onClick={() => onChange('dark')}
      >
        <MoonIcon />
        <span>{darkLabel}</span>
      </button>
    </div>
  );
}

function SunIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" strokeLinecap="round" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M21 14.5A8.5 8.5 0 0 1 9.5 3 7 7 0 1 0 21 14.5z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
