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
  return (
    <div
      className={cn(
        'flex min-h-touch items-center justify-between gap-4 rounded-xl px-2 py-2',
        'transition-colors duration-fast hover:bg-white/[0.03]',
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className="cursor-pointer text-sm font-semibold text-dastresa-text">
          {label}
        </label>
        {description ? (
          <p className="mt-0.5 text-xs leading-snug text-dastresa-muted">{description}</p>
        ) : null}
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        aria-label={label}
      />
    </div>
  );
}
