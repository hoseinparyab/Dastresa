import type { ReactNode, SelectHTMLAttributes } from 'react';
import { cn } from '@/shared/ui/cn';

export function SelectField({
  label,
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block px-1 py-2">
      <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
        {label}
      </span>
      <select
        className={cn(
          'wp-touch w-full rounded-xl border border-white/10 bg-dastresa-surface/90 px-3 text-sm text-dastresa-text',
          'transition-colors duration-fast hover:border-sky-400/40',
          className,
        )}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}
