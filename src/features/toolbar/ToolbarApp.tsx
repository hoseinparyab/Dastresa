import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { EventMap } from '@/core/types/events';
import { prefersReducedMotion } from '@/core/utils';
import { t, type AppLocale } from '@/shared/i18n/messages';
import {
  CHIP_H,
  CHIP_W,
  PANEL_H,
  PANEL_W,
  clampPos,
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
  state: { readerMode: boolean; readingFocus: boolean },
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
  onCommand,
  onMoved,
}: ToolbarAppProps) {
  const dockRef = useRef<HTMLDivElement | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const dragging = useRef<{ ox: number; oy: number } | null>(null);
  const reduceMotion = useMemo(() => prefersReducedMotion(), []);
  const pos = useMemo(() => dragPos ?? { x, y }, [dragPos, x, y]);
  const primary = useMemo(
    () => primaryButtons(locale, { readerMode, readingFocus }),
    [locale, readerMode, readingFocus],
  );
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

  const openToolbar = useCallback(() => {
    const next = clampPos(window, pos, PANEL_W, PANEL_H);
    if (next.x !== pos.x || next.y !== pos.y) {
      setDragPos(next);
      onMoved(next.x, next.y);
    }
    setOpen(true);
  }, [onMoved, pos]);

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
      const next = clampPos(window, { x: nx, y: ny }, PANEL_W, PANEL_H);
      setDragPos(next);
      onMoved(next.x, next.y);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, onMoved, pos, collapseToolbar]);

  const moreId = 'dastresa-toolbar-more';

  return (
    <div
      ref={dockRef}
      role="toolbar"
      aria-label={t(locale, 'toolbarAria')}
      className={`dock${open ? '' : ' collapsed'}`}
      dir={dir}
      tabIndex={open ? 0 : -1}
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
        <button
          type="button"
          className="chip"
          aria-label={t(locale, 'toolbarOpen')}
          aria-expanded={false}
          title={t(locale, 'toolbarOpen')}
          onClick={openToolbar}
          style={{
            border: 0,
            background: 'transparent',
            color: 'inherit',
            font: 'inherit',
            width: '100%',
            cursor: 'pointer',
          }}
        >
          <span className="dot" aria-hidden />
          <span className="title">{t(locale, 'brand')}</span>
          <span className="icon-btn" aria-hidden>
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
        </button>
      ) : (
        <>
          <div className="header">
            <div className="brand">
              <span className="dot" aria-hidden />
              <p className="title" aria-hidden>
                {t(locale, 'brand')}
              </p>
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
