import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { EventMap } from '@/core/types/events';
import { prefersReducedMotion } from '@/core/utils';
import { t, type AppLocale } from '@/shared/i18n/messages';
import {
  CHIP_H,
  CHIP_W,
  PANEL_W,
  clampPos,
  panelHeight,
} from '@/features/toolbar/geometry';

type Command = EventMap['toolbar:command']['command'];

interface ToolbarBtn {
  command: Command;
  label: string;
  aria: string;
  danger?: boolean;
  soft?: boolean;
  pressed?: boolean;
}

function primaryButtons(
  locale: AppLocale,
  state: { readerMode: boolean; readingFocus: boolean; summarizing: boolean },
): ToolbarBtn[] {
  return [
    {
      command: 'reader',
      label: t(locale, 'cmdReader'),
      aria: t(locale, 'ariaReader'),
      pressed: state.readerMode,
    },
    { command: 'read', label: t(locale, 'cmdSpeak'), aria: t(locale, 'ariaSpeak') },
    { command: 'zoom-in', label: t(locale, 'cmdZoomIn'), aria: t(locale, 'ariaZoomIn') },
    { command: 'zoom-out', label: t(locale, 'cmdZoomOut'), aria: t(locale, 'ariaZoomOut') },
    { command: 'contrast', label: t(locale, 'cmdTheme'), aria: t(locale, 'ariaTheme') },
    {
      command: 'focus',
      label: t(locale, 'cmdFocus'),
      aria: t(locale, 'ariaFocus'),
      pressed: state.readingFocus,
    },
    {
      command: 'summary',
      label: state.summarizing ? t(locale, 'cmdSummaryBusy') : t(locale, 'cmdSummary'),
      aria: state.summarizing ? t(locale, 'summaryLoading') : t(locale, 'ariaSummary'),
      pressed: state.summarizing,
      soft: state.summarizing,
    },
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

export interface ToolbarAppProps {
  x: number;
  y: number;
  locale: AppLocale;
  dir: 'ltr' | 'rtl';
  readerMode: boolean;
  readingFocus: boolean;
  summarizing?: boolean;
  /** Popup/toolbar chrome: light | dark */
  uiChrome?: 'light' | 'dark';
  /** Friendly page-type label already localized (e.g. "مقاله") */
  pageTypeLabel?: string;
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
          className={`btn${btn.danger ? ' danger' : ''}${btn.soft ? ' soft' : ''}${btn.pressed ? ' pressed' : ''}`}
          aria-label={btn.aria}
          aria-pressed={btn.pressed === undefined ? undefined : btn.pressed}
          title={btn.aria}
          onClick={() => onCommand(btn.command)}
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
}

export function ToolbarApp({
  x,
  y,
  locale,
  dir,
  readerMode,
  readingFocus,
  summarizing = false,
  uiChrome = 'dark',
  pageTypeLabel,
  onCommand,
  onMoved,
}: ToolbarAppProps) {
  const dockRef = useRef<HTMLDivElement | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const dragRef = useRef<{
    ox: number;
    oy: number;
    startX: number;
    startY: number;
    x: number;
    y: number;
    moved: boolean;
    fromChip: boolean;
  } | null>(null);
  const skipChipClick = useRef(false);
  const reduceMotion = useMemo(() => prefersReducedMotion(), []);
  const pos = useMemo(() => dragPos ?? { x, y }, [dragPos, x, y]);
  const primary = useMemo(
    () => primaryButtons(locale, { readerMode, readingFocus, summarizing }),
    [locale, readerMode, readingFocus, summarizing],
  );
  const speech = useMemo(() => speechButtons(locale), [locale]);
  const system = useMemo(() => systemButtons(locale), [locale]);

  const liveHeight = useCallback(() => {
    const el = dockRef.current;
    if (el) {
      const h = el.getBoundingClientRect().height;
      if (h > 0) return Math.min(h, window.innerHeight - 24);
    }
    return panelHeight(open, moreOpen);
  }, [moreOpen, open]);

  const reclampToViewport = useCallback(() => {
    const width = open ? PANEL_W : CHIP_W;
    const height = liveHeight();
    const next = clampPos(window, pos, width, height);
    if (next.x === pos.x && next.y === pos.y) return;
    setDragPos(next);
    onMoved(next.x, next.y);
  }, [liveHeight, onMoved, open, pos]);

  useEffect(() => {
    window.addEventListener('resize', reclampToViewport);
    return () => window.removeEventListener('resize', reclampToViewport);
  }, [reclampToViewport]);

  /** After open/more toggles, measure real dock height and keep it on-screen. */
  useEffect(() => {
    const el = dockRef.current;
    if (!el || !open) return;

    const run = () => {
      const height = Math.min(el.getBoundingClientRect().height || panelHeight(true, moreOpen), window.innerHeight - 24);
      const next = clampPos(window, { x: pos.x, y: pos.y }, PANEL_W, height);
      if (next.x === pos.x && next.y === pos.y) return;
      setDragPos(next);
      onMoved(next.x, next.y);
    };

    run();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => run()) : null;
    ro?.observe(el);
    return () => ro?.disconnect();
    // Intentionally depend on expand state only; pos is read fresh inside run via closure update each effect.
  }, [moreOpen, open, onMoved, pos.x, pos.y]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      const target = e.target as HTMLElement;
      const fromChip = !open && Boolean(target.closest('.chip'));
      // Open panel: drag only from non-button chrome. Collapsed chip: always draggable.
      if (!fromChip && target.closest('button')) return;

      dragRef.current = {
        ox: e.clientX - pos.x,
        oy: e.clientY - pos.y,
        startX: e.clientX,
        startY: e.clientY,
        x: pos.x,
        y: pos.y,
        moved: false,
        fromChip,
      };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [open, pos.x, pos.y],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;

      const dist = Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY);
      if (!drag.moved && dist < 6) return;
      drag.moved = true;

      const width = open ? PANEL_W : CHIP_W;
      const height = liveHeight();
      const next = clampPos(
        window,
        {
          x: e.clientX - drag.ox,
          y: e.clientY - drag.oy,
        },
        width,
        height,
      );
      drag.x = next.x;
      drag.y = next.y;
      setDragPos(next);
    },
    [liveHeight, open],
  );

  const endPointer = useCallback(
    (e: React.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      dragRef.current = null;
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // already released
      }

      if (drag.moved) {
        skipChipClick.current = true;
        onMoved(drag.x, drag.y);
        setDragPos(null);
        return;
      }

      if (drag.fromChip) {
        // Swallow the following click so we don't open twice.
        skipChipClick.current = true;
        const next = clampPos(window, { x: drag.x, y: drag.y }, PANEL_W, panelHeight(true, false));
        if (next.x !== drag.x || next.y !== drag.y) {
          setDragPos(next);
          onMoved(next.x, next.y);
        }
        setOpen(true);
      }
    },
    [onMoved],
  );

  const onChipClick = useCallback(
    (e: React.MouseEvent) => {
      // Pointer path already opened / dragged; ignore the synthetic click.
      if (skipChipClick.current) {
        e.preventDefault();
        skipChipClick.current = false;
        return;
      }
      // Keyboard activation.
      const next = clampPos(window, pos, PANEL_W, panelHeight(true, false));
      if (next.x !== pos.x || next.y !== pos.y) {
        setDragPos(next);
        onMoved(next.x, next.y);
      }
      setOpen(true);
    },
    [onMoved, pos],
  );

  const collapseToolbar = useCallback(() => {
    setMoreOpen(false);
    setOpen(false);
    const next = clampPos(window, pos, CHIP_W, CHIP_H);
    if (next.x !== pos.x || next.y !== pos.y) {
      setDragPos(next);
      onMoved(next.x, next.y);
    }
  }, [onMoved, pos]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      const dock = dockRef.current;
      const path = typeof e.composedPath === 'function' ? e.composedPath() : [];
      const insideDock = Boolean(dock && (path.includes(dock) || dock.contains(e.target as Node)));
      if (!insideDock) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        collapseToolbar();
        return;
      }

      // Arrow move only when focus is on the dock shell (not a command button).
      if (e.target !== dock) return;
      const step = e.shiftKey ? 24 : 12;
      let nx = pos.x;
      let ny = pos.y;
      if (e.key === 'ArrowLeft') nx -= step;
      else if (e.key === 'ArrowRight') nx += step;
      else if (e.key === 'ArrowUp') ny -= step;
      else if (e.key === 'ArrowDown') ny += step;
      else return;
      e.preventDefault();
      const next = clampPos(window, { x: nx, y: ny }, PANEL_W, liveHeight());
      setDragPos(next);
      onMoved(next.x, next.y);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [liveHeight, open, onMoved, pos, collapseToolbar]);

  const moreId = 'dastresa-toolbar-more';

  return (
    <div
      ref={dockRef}
      role="toolbar"
      aria-label={t(locale, 'toolbarAria')}
      className={`dock${open ? '' : ' collapsed'}`}
      data-chrome={uiChrome === 'light' ? 'light' : 'dark'}
      dir={dir}
      tabIndex={open ? 0 : -1}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
      style={{
        left: pos.x,
        top: pos.y,
        transition: reduceMotion ? undefined : 'box-shadow 120ms ease',
      }}
    >
      {!open ? (
        <button
          type="button"
          className="chip"
          dir="ltr"
          lang={locale}
          aria-label={t(locale, 'toolbarOpen')}
          aria-expanded={false}
          title={t(locale, 'toolbarOpen')}
          onClick={onChipClick}
        >
          <span className="chip-badge" aria-hidden>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
              <path
                d="M8 12.2 10.6 14.8 16 9.2"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="chip-label">
            <span className="title" lang={locale} key={locale}>
              {t(locale, 'brand')}
            </span>
            <span className="dot" aria-hidden />
          </span>
        </button>
      ) : (
        <>
          <div className="header">
            <div className="brand">
              <p className="title" lang={locale} key={`brand-${locale}`} aria-hidden>
                {t(locale, 'brand')}
              </p>
              <span className="dot" aria-hidden />
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

          {pageTypeLabel ? (
            <p className="page-type" role="status" aria-live="polite">
              {t(locale, 'pageType')}: <strong>{pageTypeLabel}</strong>
            </p>
          ) : null}

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
