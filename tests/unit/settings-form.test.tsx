import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { SettingsForm } from '@/features/settings/components/SettingsForm';

const replace = vi.fn();
const update = vi.fn();
const hydrate = vi.fn();

vi.mock('@/shared/hooks/useSettingsStore', () => {
  const settings = {
    extensionActive: true,
    theme: 'dark',
    largeCursor: false,
    largeButtons: true,
    readerMode: false,
    readingFocus: false,
    readingRuler: false,
    focusCursorColor: 'yellow',
    zoom: {
      textScale: 1.15,
      imageScale: 1,
      lineHeight: 1.7,
      letterSpacing: 0.02,
      wordSpacing: 0.05,
      contentWidth: 72,
      maxLineLength: 70,
    },
    speech: {
      rate: 1,
      pitch: 1,
      volume: 1,
      voiceURI: '',
      preferPersian: true,
    },
    toolbarPosition: { x: 24, y: 24 },
    locale: 'en',
    dir: 'ltr',
  };

  return {
    useSettingsStore: () => ({
      settings,
      hydrated: true,
      hydrate,
      update,
      replace,
    }),
  };
});

describe('SettingsForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders core accessibility controls', () => {
    render(<SettingsForm compact />);
    expect(screen.getByLabelText('Theme')).toBeInTheDocument();
    expect(screen.getByLabelText('Reader Mode')).toBeInTheDocument();
    expect(screen.getByText(/changes apply instantly/i)).toBeInTheDocument();
  });

  it('allows toggling reader mode and persists immediately', async () => {
    const user = userEvent.setup();
    render(<SettingsForm compact />);
    const toggle = screen.getByRole('switch', { name: 'Reader Mode' });
    expect(toggle).not.toBeChecked();
    await user.click(toggle);
    expect(toggle).toBeChecked();
    expect(replace).toHaveBeenCalled();
  });
});
