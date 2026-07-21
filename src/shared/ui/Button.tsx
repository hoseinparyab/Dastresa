import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/shared/ui/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const variants: Record<Variant, string> = {
  primary: 'bg-dastresa-accent text-slate-950 hover:brightness-110 shadow-sm shadow-sky-500/20',
  secondary: 'border border-sky-400/40 bg-sky-500/10 text-sky-100 hover:bg-sky-500/20',
  ghost: 'border border-white/10 bg-transparent text-slate-200 hover:bg-white/5',
  danger: 'border border-red-400/40 bg-red-950/70 text-red-100 hover:bg-red-900/80',
};

export function Button({
  variant = 'primary',
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={cn(
        'wp-touch inline-flex items-center justify-center rounded-xl px-4 text-sm font-bold',
        'transition-all duration-fast disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
