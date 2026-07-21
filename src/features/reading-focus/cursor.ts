export const FOCUS_CURSOR_COLORS = ['sky', 'yellow', 'lime', 'magenta', 'white'] as const;

export type FocusCursorColor = (typeof FOCUS_CURSOR_COLORS)[number];

export const FOCUS_CURSOR_PALETTE: Record<
  FocusCursorColor,
  { fill: string; stroke: string; halo: string; label: string }
> = {
  sky: { fill: '#38bdf8', stroke: '#0f172a', halo: 'rgba(56, 189, 248, 0.45)', label: 'Sky' },
  yellow: { fill: '#facc15', stroke: '#000000', halo: 'rgba(250, 204, 21, 0.5)', label: 'Yellow' },
  lime: { fill: '#a3e635', stroke: '#14532d', halo: 'rgba(163, 230, 53, 0.45)', label: 'Lime' },
  magenta: {
    fill: '#e879f9',
    stroke: '#4a044e',
    halo: 'rgba(232, 121, 249, 0.45)',
    label: 'Magenta',
  },
  white: { fill: '#ffffff', stroke: '#000000', halo: 'rgba(255, 255, 255, 0.55)', label: 'White' },
};

/** Inline SVG arrow used as a DOM cursor (Chrome-safe, unlike CSS url() SVG cursors). */
export function buildFocusPointerSvg(color: FocusCursorColor): string {
  const { fill, stroke } = FOCUS_CURSOR_PALETTE[color];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 48 48" aria-hidden="true">
  <path fill="${fill}" stroke="${stroke}" stroke-width="3.5" stroke-linejoin="round"
    d="M8 4 L8 40 L18 30 L26 44 L32 41 L24 27 L38 27 Z"/>
</svg>`;
}
