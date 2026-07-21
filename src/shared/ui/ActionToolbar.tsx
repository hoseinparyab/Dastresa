import { cn } from '@/shared/ui/cn';

export interface ActionToolbarButton {
  id: string;
  label: string;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  accent?: boolean;
  disabled?: boolean;
}

interface ActionToolbarProps {
  buttons: ActionToolbarButton[];
  className?: string;
}

export function ActionToolbar({ buttons, className }: ActionToolbarProps) {
  return (
    <div
      role="toolbar"
      className={cn(
        'relative z-0 flex w-full flex-wrap items-center gap-1 rounded-2xl border border-white/10',
        'bg-black/20 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]',
        className,
      )}
    >
      {buttons.map((btn) => (
        <button
          key={btn.id}
          type="button"
          disabled={btn.disabled}
          onClick={btn.onClick}
          className={cn(
            'wp-touch flex flex-1 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold',
            'transition-all duration-fast disabled:cursor-not-allowed disabled:opacity-50',
            btn.danger && 'border border-red-400/40 bg-red-950/80 text-red-100 hover:bg-red-900',
            btn.accent &&
              !btn.danger &&
              'bg-dastresa-accent text-slate-950 shadow-sm hover:brightness-110',
            btn.active &&
              !btn.danger &&
              !btn.accent &&
              'bg-dastresa-accent/20 text-dastresa-accent shadow-sm',
            !btn.active &&
              !btn.danger &&
              !btn.accent &&
              'text-slate-300 hover:bg-white/5 hover:text-white',
          )}
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
}
