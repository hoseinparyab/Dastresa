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
    <label className="block px-1 py-2.5">
      <span className="mb-2 block text-base font-semibold tracking-normal text-slate-100">
        {label}
      </span>
      <select
        className={cn(
          'wp-touch w-full rounded-xl border border-white/15 bg-dastresa-surface px-3 text-lg text-dastresa-text',
          'transition-colors duration-fast hover:border-sky-400/50 motion-reduce:transition-none',
          className,
        )}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}
