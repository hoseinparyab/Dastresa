import { clamp } from '@/core/utils';

export const CHIP_W = 190;
export const CHIP_H = 52;
export const PANEL_W = 300;
export const PANEL_H = 360;
/** Open panel with speech + system sections expanded. */
export const PANEL_H_MORE = 580;

export function panelHeight(open: boolean, moreOpen = false): number {
  if (!open) return CHIP_H;
  return moreOpen ? PANEL_H_MORE : PANEL_H;
}
export const MARGIN = 12;

/** Legacy default sat under site headers and looked broken on refresh. */
export function isLegacyTopLeft(pos: { x: number; y: number }): boolean {
  return pos.x <= 24 && pos.y <= 24;
}

export function bottomRight(win: Window, width: number, height: number): { x: number; y: number } {
  return {
    x: Math.max(MARGIN, win.innerWidth - width - MARGIN),
    y: Math.max(MARGIN, win.innerHeight - height - MARGIN),
  };
}

export function clampPos(
  win: Window,
  pos: { x: number; y: number },
  width: number,
  height: number,
): { x: number; y: number } {
  return {
    x: clamp(pos.x, MARGIN, Math.max(MARGIN, win.innerWidth - width - MARGIN)),
    y: clamp(pos.y, MARGIN, Math.max(MARGIN, win.innerHeight - height - MARGIN)),
  };
}

export function resolveToolbarPosition(
  win: Window,
  saved: { x: number; y: number },
  open: boolean,
): { x: number; y: number } {
  const width = open ? PANEL_W : CHIP_W;
  const height = open ? PANEL_H : CHIP_H;
  if (isLegacyTopLeft(saved)) return bottomRight(win, width, height);
  return clampPos(win, saved, width, height);
}
