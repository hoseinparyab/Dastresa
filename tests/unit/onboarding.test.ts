import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ONBOARDING_VERSION, STORAGE_KEYS } from '@/core/constants';
import {
  getOnboardingState,
  markOnboardingComplete,
  resetOnboarding,
  shouldShowOnboarding,
} from '@/features/onboarding/onboarding-storage';
import { TOUR_STEPS } from '@/features/onboarding/tour-steps';
import { tFormat } from '@/shared/i18n/messages';

const store = new Map<string, unknown>();

beforeEach(() => {
  store.clear();
  vi.stubGlobal('chrome', {
    storage: {
      local: {
        get: vi.fn(async (key: string) => {
          if (store.has(key)) return { [key]: store.get(key) };
          return {};
        }),
        set: vi.fn(async (items: Record<string, unknown>) => {
          for (const [key, value] of Object.entries(items)) store.set(key, value);
        }),
      },
    },
    runtime: {
      getURL: (path: string) => `chrome-extension://test/${path}`,
    },
  });
});

describe('onboarding storage', () => {
  it('shows tour when unset', async () => {
    await expect(shouldShowOnboarding()).resolves.toBe(true);
  });

  it('hides tour after completion', async () => {
    await markOnboardingComplete();
    await expect(shouldShowOnboarding()).resolves.toBe(false);
    const state = await getOnboardingState();
    expect(state).toEqual({
      completed: true,
      version: ONBOARDING_VERSION,
      skipped: false,
    });
    expect(store.get(STORAGE_KEYS.ONBOARDING)).toBeTruthy();
  });

  it('shows tour again after reset', async () => {
    await markOnboardingComplete();
    await resetOnboarding();
    await expect(shouldShowOnboarding()).resolves.toBe(true);
  });
});

describe('tour steps', () => {
  it('has six guided steps', () => {
    expect(TOUR_STEPS).toHaveLength(6);
  });

  it('formats progress copy', () => {
    expect(tFormat('en', 'tourProgress', { current: 2, total: 6 })).toBe('Step 2 of 6');
    expect(tFormat('fa', 'tourProgress', { current: 2, total: 6 })).toBe('مرحله 2 از 6');
  });
});
