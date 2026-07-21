import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { FeatureContext, IFeature } from '@/core/contracts';
import { EVENTS, FEATURE_IDS, STORAGE_KEYS } from '@/core/constants';
import type { EventMap } from '@/core/types/events';
import { clamp, prefersReducedMotion } from '@/core/utils';
import { parseSettings, type DastresaSettings } from '@/features/settings/schema/settings-schema';
import { t, type AppLocale } from '@/shared/i18n/messages';

type Command = EventMap['toolbar:command']['command'];

interface ToolbarBtn {
  command: Command;
  label: string;
  aria: string;
  danger?: boolean;
  soft?: boolean;
}

function primaryButtons(locale: AppLocale): ToolbarBtn[] {
  return [
    { command: 'reader', label: t(locale, 'cmdReader'), aria: t(locale, 'ariaReader') },
    { command: 'read', label: t(locale, 'cmdSpeak'), aria: t(locale, 'ariaSpeak') },
    { command: 'zoom-in', label: t(locale, 'cmdZoomIn'), aria: t(locale, 'ariaZoomIn') },
    { command: 'zoom-out', label: t(locale, 'cmdZoomOut'), aria: t(locale, 'ariaZoomOut') },
    { command: 'contrast', label: t(locale, 'cmdTheme'), aria: t(locale, 'ariaTheme') },
    { command: 'focus', label: t(locale, 'cmdFocus'), aria: t(locale, 'ariaFocus') },
  ];
}

function speechButtons(locale: AppLocale): ToolbarBtn[] {
  return [
    { command: 'pause', label: t(locale, 'cmdPause'), aria: t(locale, 'ariaPause') },
    { command: 'resume', label: t(locale, 'cmdResume'), aria: t(locale, 'ariaResume') },
    { command: 'stop', label: t(locale, 'cmdStop'), aria: t(locale, 'ariaStop') },
  ];
}

function systemButtons(locale: AppLocale): ToolbarBtn[] {
  return [
    { command: 'settings', label: t(locale, 'cmdSettings'), aria: t(locale, 'ariaSettings') },
    {
      command: 'reset',
      label: t(locale, 'cmdReset'),
      aria: t(locale, 'ariaReset'),
      soft: true,
    },
    {
      command: 'exit',
      label: t(locale, 'cmdExit'),
      aria: t(locale, 'ariaExit'),
      danger: true,
    },
  ];
}
const CHIP_W = 168;
const CHIP_H = 56;
const PANEL_W = 280;
const PANEL_H = 320;
const MARGIN = 12;

/** Legacy default sat under site headers and looked broken on refresh. */
function isLegacyTopLeft(pos: { x: number; y: number }): boolean {
  return pos.x <= 24 && pos.y <= 24;
}

function bottomRight(win: Window, width: number, height: number): { x: number; y: number } {
  return {
    x: Math.max(MARGIN, win.innerWidth - width - MARGIN),
    y: Math.max(MARGIN, win.innerHeight - height - MARGIN),
  };
}

function clampPos(
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

function resolveToolbarPosition(
  win: Window,
  saved: { x: number; y: number },
  open: boolean,
): { x: number; y: number } {
  const width = open ? PANEL_W : CHIP_W;
  const height = open ? PANEL_H : CHIP_H;
  if (isLegacyTopLeft(saved)) return bottomRight(win, width, height);
  return clampPos(win, saved, width, height);
}

const TOOLBAR_CSS = `
  :host {
    all: initial !important;
    position: fixed !important;
    inset: 0 !important;
    width: 0 !important;
    height: 0 !important;
    overflow: visible !important;
    pointer-events: none !important;
    z-index: 2147483646 !important;
  }
  * { box-sizing: border-box; }

  .dock {
    position: fixed;
    z-index: 2147483646;
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: max-content;
    max-width: min(260px, calc(100vw - 16px));
    padding: 6px;
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.16);
    background: #0f172a;
    color: #f8fafc;
    font-family: Tahoma, "Segoe UI", "Source Sans 3", sans-serif;
    box-shadow: 0 10px 28px rgba(2, 6, 23, 0.55);
    pointer-events: auto;
    cursor: grab;
    touch-action: none;
    user-select: none;
  }
  .dock.collapsed {
    padding: 4px;
    border-radius: 999px;
  }
  .dock:active { cursor: grabbing; }

  .chip {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 48px;
    padding-block: 0;
    padding-inline: 10px 6px;
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: #38bdf8;
    box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.2);
    flex-shrink: 0;
  }
  .title {
    margin: 0;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.01em;
    white-space: nowrap;
    color: #f8fafc;
  }
  .icon-btn {
    min-width: 48px;
    min-height: 48px;
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: rgba(56, 189, 248, 0.16);
    color: #e0f2fe;
    font-size: 16px;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
  }
  .icon-btn:hover { background: rgba(56, 189, 248, 0.28); }
  .icon-btn:focus-visible {
    outline: 3px solid #38bdf8;
    outline-offset: 2px;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    padding: 0 2px 2px;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }
  .hint {
    margin: 0;
    font-size: 12px;
    color: #cbd5e1;
  }
  .header-actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .mini {
    min-width: 44px;
    min-height: 44px;
    border: 0;
    border-radius: 10px;
    background: transparent;
    color: #e2e8f0;
    font-size: 16px;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
  }
  .mini:hover { background: rgba(148, 163, 184, 0.12); color: #fff; }
  .mini:focus-visible {
    outline: 3px solid #38bdf8;
    outline-offset: 2px;
  }

  .strip {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 4px;
    padding: 4px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(2, 6, 23, 0.45);
  }
  .btn {
    min-width: 0;
    min-height: 48px;
    padding: 0 6px;
    border-radius: 10px;
    border: 1px solid transparent;
    background: transparent;
    color: #f1f5f9;
    font-size: 13px;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
    transition: background 120ms ease, color 120ms ease;
  }
  .btn:hover {
    background: rgba(56, 189, 248, 0.14);
    color: #fff;
  }
  .btn:focus-visible {
    outline: 3px solid #38bdf8;
    outline-offset: 2px;
  }
  .btn.soft {
    border-color: rgba(56, 189, 248, 0.4);
    color: #e0f2fe;
  }
  .btn.danger {
    border-color: rgba(248, 113, 113, 0.45);
    background: rgba(127, 29, 29, 0.45);
    color: #fecaca;
  }
  .btn.ghost {
    width: 100%;
    min-height: 48px;
    border-color: rgba(148, 163, 184, 0.28);
    color: #e2e8f0;
  }
  .panel-title {
    margin: 4px 0 0 2px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.04em;
    color: #cbd5e1;
  }
  @media (prefers-reduced-motion: reduce) {
    .btn, .dock { transition: none !important; }
  }
`;

interface ToolbarProps {
  x: number;
  y: number;
  locale: AppLocale;
  dir: 'ltr' | 'rtl';
  onCommand: (command: Command) => void;
  onMoved: (x: number, y: number) => void;
}

function BtnGrid({
  items,
  onCommand,
  label,
}: {
  items: ToolbarBtn[];
  onCommand: (command: Command) => void;
  label: string;
}) {
  return (
    <div className="strip" role="group" aria-label={label}>
      {items.map((btn) => (
        <button
          key={btn.command}
          type="button"
          className={`btn${btn.danger ? ' danger' : ''}${btn.soft ? ' soft' : ''}`}
          aria-label={btn.aria}
          title={btn.aria}
          onClick={() => onCommand(btn.command)}
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
}

function ToolbarApp({ x, y, locale, dir, onCommand, onMoved }: ToolbarProps) {
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const dragging = useRef<{ ox: number; oy: number } | null>(null);
  const reduceMotion = useMemo(() => prefersReducedMotion(), []);
  const pos = useMemo(() => dragPos ?? { x, y }, [dragPos, x, y]);
  const primary = useMemo(() => primaryButtons(locale), [locale]);
  const speech = useMemo(() => speechButtons(locale), [locale]);
  const system = useMemo(() => systemButtons(locale), [locale]);

  useEffect(() => {
    const onResize = () => {
      const width = open ? PANEL_W : CHIP_W;
      const height = open ? PANEL_H : CHIP_H;
      const next = clampPos(window, pos, width, height);
      if (next.x === pos.x && next.y === pos.y) return;
      setDragPos(next);
      onMoved(next.x, next.y);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [onMoved, open, pos]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button')) return;
      dragging.current = { ox: e.clientX - pos.x, oy: e.clientY - pos.y };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [pos.x, pos.y],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return;
      const width = open ? PANEL_W : CHIP_W;
      const height = open ? PANEL_H : CHIP_H;
      setDragPos(
        clampPos(
          window,
          {
            x: e.clientX - dragging.current.ox,
            y: e.clientY - dragging.current.oy,
          },
          width,
          height,
        ),
      );
    },
    [open],
  );

  const onPointerUp = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = null;
    onMoved(pos.x, pos.y);
    setDragPos(null);
  }, [onMoved, pos.x, pos.y]);

  const openToolbar = () => {
    const next = clampPos(window, pos, PANEL_W, PANEL_H);
    if (next.x !== pos.x || next.y !== pos.y) {
      setDragPos(next);
      onMoved(next.x, next.y);
    }
    setOpen(true);
  };

  const collapseToolbar = () => {
    setMoreOpen(false);
    setOpen(false);
    const next = clampPos(window, pos, CHIP_W, CHIP_H);
    if (next.x !== pos.x || next.y !== pos.y) {
      setDragPos(next);
      onMoved(next.x, next.y);
    }
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        collapseToolbar();
      }
      const step = e.shiftKey ? 24 : 12;
      let nx = pos.x;
      let ny = pos.y;
      if (e.key === 'ArrowLeft') nx -= step;
      else if (e.key === 'ArrowRight') nx += step;
      else if (e.key === 'ArrowUp') ny -= step;
      else if (e.key === 'ArrowDown') ny += step;
      else return;
      e.preventDefault();
      const next = clampPos(window, { x: nx, y: ny }, PANEL_W, PANEL_H);
      setDragPos(next);
      onMoved(next.x, next.y);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onMoved, pos.x, pos.y]);

  const moreId = 'dastresa-toolbar-more';

  return (
    <div
      role="toolbar"
      aria-label={t(locale, 'toolbarAria')}
      className={`dock${open ? '' : ' collapsed'}`}
      dir={dir}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{
        left: pos.x,
        top: pos.y,
        transition: reduceMotion ? undefined : 'box-shadow 120ms ease',
      }}
    >
      {!open ? (
        <div className="chip">
          <span className="dot" aria-hidden />
          <button
            type="button"
            className="title"
            style={{
              background: 'transparent',
              border: 0,
              color: 'inherit',
              cursor: 'pointer',
              font: 'inherit',
              padding: 0,
            }}
            aria-label={t(locale, 'toolbarOpen')}
            onClick={openToolbar}
          >
            {t(locale, 'brand')}
          </button>
          <button
            type="button"
            className="icon-btn"
            aria-label={t(locale, 'toolbarOpen')}
            aria-expanded={false}
            title={t(locale, 'toolbarOpen')}
            onClick={openToolbar}
          >
            {'▴'}
          </button>
        </div>
      ) : (
        <>
          <div className="header">
            <div className="brand">
              <span className="dot" aria-hidden />
              <p className="title">{t(locale, 'brand')}</p>
              <p className="hint">{t(locale, 'toolbarDrag')}</p>
            </div>
            <div className="header-actions">
              <button
                type="button"
                className="mini"
                aria-label={t(locale, 'toolbarCollapse')}
                aria-expanded={true}
                title={t(locale, 'toolbarCollapse')}
                onClick={collapseToolbar}
              >
                {'▾'}
              </button>
            </div>
          </div>

          <BtnGrid
            items={primary}
            onCommand={onCommand}
            label={t(locale, 'toolbarPrimaryGroup')}
          />

          <button
            type="button"
            className="btn ghost"
            aria-expanded={moreOpen}
            aria-controls={moreId}
            onClick={() => setMoreOpen((v) => !v)}
          >
            {moreOpen ? t(locale, 'toolbarLess') : t(locale, 'toolbarMore')}
          </button>

          {moreOpen && (
            <div id={moreId}>
              <p className="panel-title">{t(locale, 'toolbarSpeech')}</p>
              <BtnGrid
                items={speech}
                onCommand={onCommand}
                label={t(locale, 'toolbarSpeechGroup')}
              />
              <p className="panel-title">{t(locale, 'toolbarSystem')}</p>
              <BtnGrid
                items={system}
                onCommand={onCommand}
                label={t(locale, 'toolbarSystemGroup')}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export class ToolbarFeature implements IFeature {
  readonly id = FEATURE_IDS.TOOLBAR;
  readonly name = 'Accessibility Toolbar';
  readonly version = '0.1.0';
  private enabled = true;
  private host?: HTMLElement;
  private root?: Root;
  private ctx?: FeatureContext;
  private pos = { x: 24, y: 24 };
  private locale: AppLocale = 'fa';
  private dir: 'ltr' | 'rtl' = 'rtl';
  private unsubs: Array<() => void> = [];
  private migrated = false;

  initialize(ctx: FeatureContext): void {
    this.ctx = ctx;
    void this.hydrateFromStorage().then(() => {
      this.mount();
      this.render();
    });

    this.unsubs.push(
      ctx.bus.on(EVENTS.SETTINGS_CHANGED, ({ settings }) => {
        this.applyLocale(settings);
        this.pos = resolveToolbarPosition(ctx.window, settings.toolbarPosition, false);
        this.render();
      }),
    );
  }

  private applyLocale(settings: DastresaSettings): void {
    this.locale = settings.locale === 'en' ? 'en' : 'fa';
    this.dir = settings.dir === 'ltr' ? 'ltr' : 'rtl';
  }

  private async hydrateFromStorage(): Promise<void> {
    if (!this.ctx) return;
    const raw = await this.ctx.storage.get<unknown>(STORAGE_KEYS.SETTINGS);
    const settings = parseSettings(raw);
    this.applyLocale(settings);
    const resolved = resolveToolbarPosition(this.ctx.window, settings.toolbarPosition, false);
    this.pos = resolved;

    if (
      !this.migrated &&
      (isLegacyTopLeft(settings.toolbarPosition) ||
        settings.toolbarPosition.x !== resolved.x ||
        settings.toolbarPosition.y !== resolved.y)
    ) {
      this.migrated = true;
      await this.ctx.storage.set(STORAGE_KEYS.SETTINGS, {
        ...settings,
        toolbarPosition: resolved,
      });
    }
  }

  private mount(): void {
    if (!this.ctx || this.host) return;
    this.host = this.ctx.document.createElement('div');
    this.host.id = 'Dastresa-toolbar-host';
    this.host.setAttribute('data-Dastresa', 'toolbar');
    this.host.style.cssText =
      'all:initial;position:fixed;inset:0;width:0;height:0;overflow:visible;pointer-events:none;z-index:2147483646;';
    const shadow = this.host.attachShadow({ mode: 'open' });
    const style = this.ctx.document.createElement('style');
    style.textContent = TOOLBAR_CSS;
    const mount = this.ctx.document.createElement('div');
    shadow.appendChild(style);
    shadow.appendChild(mount);
    this.ctx.document.documentElement.appendChild(this.host);
    this.root = createRoot(mount);
  }

  private render(): void {
    if (!this.root || !this.ctx) return;
    this.root.render(
      <ToolbarApp
        x={this.pos.x}
        y={this.pos.y}
        locale={this.locale}
        dir={this.dir}
        onCommand={(command) => {
          if (command === 'settings') {
            try {
              void chrome.runtime.sendMessage({ type: 'open-options' });
            } catch {
              // ignore when messaging unavailable
            }
          }
          this.ctx?.bus.emit(EVENTS.TOOLBAR_COMMAND, { command });
        }}
        onMoved={(nx, ny) => {
          if (this.pos.x === nx && this.pos.y === ny) return;
          this.pos = { x: nx, y: ny };
          this.ctx?.bus.emit(EVENTS.TOOLBAR_MOVED, { x: nx, y: ny });
        }}
      />,
    );
  }

  dispose(): void {
    this.unsubs.forEach((u) => u());
    this.root?.unmount();
    this.host?.remove();
    this.root = undefined;
    this.host = undefined;
  }

  enable(): void {
    this.enabled = true;
    if (!this.host) {
      void this.hydrateFromStorage().then(() => {
        this.mount();
        this.render();
      });
    } else {
      this.render();
    }
  }

  disable(): void {
    this.enabled = false;
    this.root?.unmount();
    this.host?.remove();
    this.root = undefined;
    this.host = undefined;
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}

export const feature = new ToolbarFeature();
export default feature;
