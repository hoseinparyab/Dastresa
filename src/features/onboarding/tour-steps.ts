import type { MessageKey } from '@/shared/i18n/messages';

export type TourStepId =
  | 'welcome'
  | 'enable'
  | 'toolbar'
  | 'tools'
  | 'focus'
  | 'ready';

export type TourStep = {
  id: TourStepId;
  titleKey: MessageKey;
  bodyKey: MessageKey;
};

export const TOUR_STEPS: readonly TourStep[] = [
  { id: 'welcome', titleKey: 'tourStep1Title', bodyKey: 'tourStep1Body' },
  { id: 'enable', titleKey: 'tourStep2Title', bodyKey: 'tourStep2Body' },
  { id: 'toolbar', titleKey: 'tourStep3Title', bodyKey: 'tourStep3Body' },
  { id: 'tools', titleKey: 'tourStep4Title', bodyKey: 'tourStep4Body' },
  { id: 'focus', titleKey: 'tourStep5Title', bodyKey: 'tourStep5Body' },
  { id: 'ready', titleKey: 'tourStep6Title', bodyKey: 'tourStep6Body' },
] as const;
