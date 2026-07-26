import type { ReactNode } from 'react';
import { cn } from '@/shared/ui/cn';
import type { TourStepId } from '@/features/onboarding/tour-steps';

function Icon({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('relative size-12 text-sky-200', className)}
      aria-hidden
    >
      {children}
    </svg>
  );
}

function StepIcon({ stepId }: { stepId: TourStepId }) {
  switch (stepId) {
    case 'welcome':
      return (
        <Icon>
          <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" />
          <circle cx="12" cy="12" r="2.5" />
        </Icon>
      );
    case 'enable':
      return (
        <Icon>
          <path d="M12 3v9" />
          <path d="M8.5 8.5 12 12l3.5-3.5" />
          <path d="M5 15v1a4 4 0 004 4h6a4 4 0 004-4v-1" />
        </Icon>
      );
    case 'toolbar':
      return (
        <Icon>
          <rect x="3" y="5" width="18" height="14" rx="3" />
          <path d="M7 10h10M7 14h6" />
        </Icon>
      );
    case 'tools':
      return (
        <Icon>
          <rect x="3" y="3" width="8" height="8" rx="1.5" />
          <rect x="13" y="3" width="8" height="5" rx="1.5" />
          <rect x="3" y="13" width="8" height="8" rx="1.5" />
          <rect x="13" y="10" width="8" height="11" rx="1.5" />
        </Icon>
      );
    case 'focus':
      return (
        <Icon>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
        </Icon>
      );
    case 'ready':
      return (
        <Icon>
          <path d="M5 12.5 9.5 17 19 7.5" />
        </Icon>
      );
  }
}

export function TourStepVisual({
  stepId,
  className,
}: {
  stepId: TourStepId;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'relative mx-auto flex size-28 items-center justify-center overflow-hidden rounded-[1.75rem]',
        'border border-sky-400/25 bg-gradient-to-br from-sky-500/20 via-slate-900/40 to-cyan-500/10',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]',
        className,
      )}
      aria-hidden
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.35),transparent_55%)]" />
      <StepIcon stepId={stepId} />
    </div>
  );
}
