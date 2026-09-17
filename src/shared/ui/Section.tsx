import type { ReactNode } from 'react';
import { cn } from '@/shared/ui/cn';

export function Section({
  title,
  description,
  icon,
  children,
  className,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
        className,
      )}
    >
      <div className="mb-3">
        <h2 className="flex items-center gap-2 text-lg font-bold text-sky-200">
          {icon ? <span className="inline-flex shrink-0 text-current">{icon}</span> : null}
          {title}
        </h2>
        {description ? (
          <p className="mt-1.5 text-base leading-relaxed text-slate-200">{description}</p>
        ) : null}
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}
