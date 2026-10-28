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

const POINTER_PATH = 'M8 4 L8 40 L18 30 L26 44 L32 41 L24 27 L38 27 Z';

/** Inline SVG arrow used as a DOM cursor (Chrome-safe, unlike CSS url() SVG cursors). */
export function createFocusPointerSvg(doc: Document, color: FocusCursorColor): SVGSVGElement {
  const { fill, stroke } = FOCUS_CURSOR_PALETTE[color];
  const svg = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '40');
  svg.setAttribute('height', '40');
  svg.setAttribute('viewBox', '0 0 48 48');
  svg.setAttribute('aria-hidden', 'true');
  const path = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('fill', fill);
  path.setAttribute('stroke', stroke);
  path.setAttribute('stroke-width', '3.5');
  path.setAttribute('stroke-linejoin', 'round');
  path.setAttribute('d', POINTER_PATH);
  svg.appendChild(path);
  return svg;
}
