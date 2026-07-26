import { ONBOARDING_VERSION, STORAGE_KEYS } from '@/core/constants';

export type OnboardingState = {
  completed: boolean;
  version: number;
  skipped?: boolean;
};

const DEFAULT_STATE: OnboardingState = {
  completed: false,
  version: ONBOARDING_VERSION,
};

function isOnboardingState(value: unknown): value is OnboardingState {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return typeof record.completed === 'boolean' && typeof record.version === 'number';
}

export async function getOnboardingState(): Promise<OnboardingState> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.ONBOARDING);
    const raw = result[STORAGE_KEYS.ONBOARDING];
    if (isOnboardingState(raw)) return raw;
  } catch {
    // storage may be unavailable in tests / non-extension contexts
  }
  return { ...DEFAULT_STATE };
}

export async function shouldShowOnboarding(): Promise<boolean> {
  const state = await getOnboardingState();
  return !state.completed || state.version < ONBOARDING_VERSION;
}

export async function markOnboardingComplete(skipped = false): Promise<void> {
  const next: OnboardingState = {
    completed: true,
    version: ONBOARDING_VERSION,
    skipped,
  };
  await chrome.storage.local.set({ [STORAGE_KEYS.ONBOARDING]: next });
}

export async function resetOnboarding(): Promise<void> {
  await chrome.storage.local.set({
    [STORAGE_KEYS.ONBOARDING]: { ...DEFAULT_STATE },
  });
}

export function getOnboardingPageUrl(): string {
  return chrome.runtime.getURL('src/onboarding/index.html');
}

export async function openOnboardingPage(): Promise<void> {
  await chrome.tabs.create({ url: getOnboardingPageUrl() });
}
