import { Switch } from '@/shared/ui/Switch';
import { cn } from '@/shared/ui/cn';

export interface SwitchRowProps {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function SwitchRow({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
  className,
}: SwitchRowProps) {
  const labelId = `${id}-label`;
  const descId = description ? `${id}-desc` : undefined;

  return (
    <div
      className={cn(
        'flex min-h-touch items-center justify-between gap-4 rounded-xl px-2 py-2',
        'transition-colors duration-fast hover:bg-white/[0.03] motion-reduce:transition-none',
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <label
          id={labelId}
          htmlFor={id}
          className="cursor-pointer text-base font-semibold leading-snug text-dastresa-text"
        >
          {label}
        </label>
        {description ? (
          <p id={descId} className="mt-1 text-sm leading-snug text-slate-300">
            {description}
          </p>
        ) : null}
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        aria-labelledby={labelId}
        aria-describedby={descId}
      />
    </div>
  );
}
