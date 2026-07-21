import type { ReactNode } from 'react';
import { cn } from '@/shared/ui/cn';

export function Section({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
        className,
      )}
    >
      <div className="mb-3">
        <h2 className="text-base font-bold text-dastresa-text">{title}</h2>
        {description ? <p className="mt-1 text-sm leading-relaxed text-slate-300">{description}</p> : null}
      </div>
      <div className="flex flex-col gap-1">{children}</div>
    </section>
  );
}
