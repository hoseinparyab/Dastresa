import { cn } from '@/shared/ui/cn';

export function StatusPill({
  active,
  activeLabel = 'Active',
  inactiveLabel = 'Off',
}: {
  active: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}) {
  return (
    <span
      role="status"
      aria-live="polite"
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold',
        active
          ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30'
          : 'bg-slate-700/70 text-slate-300 ring-1 ring-white/10',
      )}
    >
      <span
        aria-hidden
        className={cn('size-2 rounded-full', active ? 'bg-emerald-400' : 'bg-slate-500')}
      />
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}
