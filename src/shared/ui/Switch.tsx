import { cn } from '@/shared/ui/cn';

export interface SwitchProps {
  id?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  'aria-label'?: string;
  className?: string;
}

/** Large accessible toggle — elderly-friendly 48px-adjacent hit target. */
export function Switch({
  id,
  checked,
  onCheckedChange,
  disabled = false,
  className,
  'aria-label': ariaLabel,
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      className={cn(
        'relative inline-flex h-9 w-[3.75rem] shrink-0 cursor-pointer items-center rounded-full p-1',
        'border border-transparent transition-colors duration-fast',
        'focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-dastresa-accent',
        'disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-dastresa-accent shadow-[0_0_0_3px_rgba(56,189,248,0.18)]' : 'bg-slate-600',
        className,
      )}
      onClick={() => onCheckedChange(!checked)}
    >
      <span
        aria-hidden
        className={cn(
          'pointer-events-none block size-7 rounded-full bg-white shadow-md transition-transform duration-fast',
          checked ? 'translate-x-6' : 'translate-x-0',
        )}
      />
    </button>
  );
}
