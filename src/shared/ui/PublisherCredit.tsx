import { cn } from '@/shared/ui/cn';
import { t, type AppLocale } from '@/shared/i18n/messages';

const NAJINO_URL = 'https://najino.com/';
const NAJINO_MARK_PATH = 'brand/najino-mark.svg';

function najinoMarkSrc(): string {
  try {
    return chrome.runtime.getURL(NAJINO_MARK_PATH);
  } catch {
    return `/${NAJINO_MARK_PATH}`;
  }
}

export function PublisherCredit({
  locale,
  className,
  compact = false,
}: {
  locale: AppLocale;
  className?: string;
  compact?: boolean;
}) {
  const label = `${t(locale, 'madeByNajino')} — najino.com`;

  return (
    <a
      href={NAJINO_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className={cn(
        'group flex w-full items-center gap-3 rounded-2xl border border-white/10',
        'bg-gradient-to-br from-violet-500/[0.12] via-transparent to-sky-500/[0.06]',
        'px-3 py-2.5 text-start no-underline outline-none',
        'transition-colors duration-fast motion-reduce:transition-none',
        'hover:border-violet-400/40 hover:from-violet-500/20',
        'focus-visible:ring-2 focus-visible:ring-violet-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950',
        compact ? 'min-h-12' : 'min-h-14',
        className,
      )}
    >
      <span
        className={cn(
          'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl',
          'border border-violet-400/20 bg-black',
          'shadow-[0_0_0_1px_rgba(168,85,247,0.12)]',
          compact ? 'size-10' : 'size-12',
        )}
      >
        <img
          src={najinoMarkSrc()}
          alt=""
          width={compact ? 40 : 48}
          height={compact ? 40 : 48}
          className="size-full object-contain p-0.5"
          decoding="async"
        />
      </span>

      <span className="min-w-0 flex-1 leading-tight">
        <span className="block text-xs font-medium tracking-wide text-slate-400">
          {t(locale, 'madeBy')}
        </span>
        <span className="mt-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-base font-bold tracking-tight text-slate-50 group-hover:text-violet-100">
            {t(locale, 'publisherName')}
          </span>
          <span className="text-sm font-semibold text-violet-300 group-hover:text-violet-200">
            najino.com
          </span>
        </span>
      </span>

      <span
        aria-hidden
        className="shrink-0 text-lg leading-none text-slate-500 transition-transform duration-fast group-hover:translate-x-0.5 group-hover:text-violet-300 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
      >
        →
      </span>
    </a>
  );
}
