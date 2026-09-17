/** Floating toolbar styles — light/dark chrome aligned with popup mockups. */
export const TOOLBAR_CSS = `
  :host {
    all: initial !important;
    position: fixed !important;
    inset: 0 !important;
    width: 100% !important;
    height: 100% !important;
    overflow: visible !important;
    pointer-events: none !important;
    z-index: 2147483646 !important;
  }
  * { box-sizing: border-box; }

  .dock {
    --tb-bg: #0b1220;
    --tb-surface: #111827;
    --tb-text: #f8fafc;
    --tb-muted: #94a3b8;
    --tb-accent: #38bdf8;
    --tb-accent-soft: rgba(56, 189, 248, 0.16);
    --tb-border: #334155;
    --tb-chip-side: #0f172a;
    --tb-btn-hover: rgba(56, 189, 248, 0.14);
    --tb-btn-pressed-bg: rgba(56, 189, 248, 0.22);
    --tb-btn-pressed-border: rgba(56, 189, 248, 0.65);
    --tb-danger-bg: rgba(127, 29, 29, 0.45);
    --tb-danger-text: #fecaca;
    --tb-shadow: 0 12px 32px rgba(2, 6, 23, 0.55);
    --tb-scroll-track: rgba(15, 23, 42, 0.35);
    --tb-scroll-thumb: rgba(56, 189, 248, 0.45);
    --tb-scroll-thumb-hover: rgba(56, 189, 248, 0.75);

    position: fixed;
    z-index: 2147483646;
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: max-content;
    max-width: min(300px, calc(100vw - 16px));
    max-height: calc(100vh - 24px);
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior: contain;
    scrollbar-width: thin;
    scrollbar-color: var(--tb-scroll-thumb) var(--tb-scroll-track);
    padding: 10px;
    border-radius: 18px;
    border: 1px solid var(--tb-border);
    background: var(--tb-bg);
    color: var(--tb-text);
    font-family: Tahoma, "Segoe UI", "Source Sans 3", sans-serif;
    box-shadow: var(--tb-shadow);
    pointer-events: auto;
    cursor: grab;
    touch-action: none;
    user-select: none;
  }

  .dock::-webkit-scrollbar {
    width: 8px;
  }
  .dock::-webkit-scrollbar-track {
    margin: 10px 0;
    background: var(--tb-scroll-track);
    border-radius: 999px;
  }
  .dock::-webkit-scrollbar-thumb {
    background: var(--tb-scroll-thumb);
    border-radius: 999px;
    border: 2px solid transparent;
    background-clip: padding-box;
  }
  .dock::-webkit-scrollbar-thumb:hover {
    background: var(--tb-scroll-thumb-hover);
    border: 2px solid transparent;
    background-clip: padding-box;
  }
  .dock::-webkit-scrollbar-button {
    display: none;
    width: 0;
    height: 0;
  }
  .dock::-webkit-scrollbar-corner {
    background: transparent;
  }

  .dock[data-chrome="light"] {
    --tb-bg: #f1f5f9;
    --tb-surface: #ffffff;
    --tb-text: #0f172a;
    --tb-muted: #475569;
    --tb-accent: #2563eb;
    --tb-accent-soft: #eff6ff;
    --tb-border: #e2e8f0;
    --tb-chip-side: #1e3a8a;
    --tb-btn-hover: rgba(37, 99, 235, 0.1);
    --tb-btn-pressed-bg: rgba(37, 99, 235, 0.14);
    --tb-btn-pressed-border: rgba(37, 99, 235, 0.55);
    --tb-danger-bg: #fef2f2;
    --tb-danger-text: #b91c1c;
    --tb-shadow: 0 12px 28px rgba(15, 23, 42, 0.16);
    --tb-scroll-track: rgba(148, 163, 184, 0.28);
    --tb-scroll-thumb: rgba(37, 99, 235, 0.45);
    --tb-scroll-thumb-hover: rgba(37, 99, 235, 0.75);
  }

  .dock.collapsed {
    padding: 0;
    border-radius: 999px;
    overflow: hidden;
    max-height: none;
    background: var(--tb-bg);
    border: 1px solid var(--tb-border);
    box-shadow: var(--tb-shadow);
  }
  .dock:active { cursor: grabbing; }

  .chip {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    gap: 0;
    min-height: 52px;
    min-width: 168px;
    padding: 0;
    text-align: start;
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    width: 100%;
    cursor: grab;
  }
  .dock.collapsed:active .chip { cursor: grabbing; }
  .chip:focus-visible {
    outline: 3px solid var(--tb-accent);
    outline-offset: 2px;
  }

  .chip-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 52px;
    min-height: 52px;
    flex-shrink: 0;
    background: var(--tb-chip-side);
    color: #fff;
  }
  .dock[data-chrome="light"] .chip-badge {
    background: var(--tb-accent);
  }
  .chip-badge svg {
    width: 26px;
    height: 26px;
    display: block;
  }

  .chip-label {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-inline: 12px 14px;
    min-height: 52px;
    background: var(--tb-surface);
  }
  .dock.collapsed .chip-label {
    background: #020617;
  }
  .dock[data-chrome="light"].collapsed .chip-label {
    background: var(--tb-surface);
  }

  .title {
    margin: 0;
    font-size: 16px;
    font-weight: 800;
    letter-spacing: 0.01em;
    white-space: nowrap;
    color: var(--tb-text);
  }
  .chip .title {
    font-size: 16px;
    line-height: 1;
  }
  .chip .title[lang="fa"] {
    font-size: 17px;
    letter-spacing: 0;
  }
  .dock.collapsed .title { color: #f8fafc; }
  .dock[data-chrome="light"].collapsed .title { color: var(--tb-text); }

  .dot {
    width: 9px;
    height: 9px;
    border-radius: 999px;
    background: var(--tb-accent);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--tb-accent) 28%, transparent);
    flex-shrink: 0;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 2px 2px 4px;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }
  .brand .title { color: var(--tb-text); }
  .hint {
    margin: 0;
    font-size: 12px;
    font-weight: 600;
    color: var(--tb-muted);
    white-space: nowrap;
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
    border-radius: 12px;
    background: transparent;
    color: var(--tb-muted);
    font-size: 16px;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
  }
  .mini:hover { background: var(--tb-btn-hover); color: var(--tb-text); }
  .mini:focus-visible {
    outline: 3px solid var(--tb-accent);
    outline-offset: 2px;
  }

  .page-type {
    margin: 0;
    padding: 11px 12px;
    border-radius: 14px;
    background: var(--tb-accent-soft);
    border: 1px solid color-mix(in srgb, var(--tb-accent) 35%, transparent);
    color: var(--tb-text);
    font-size: 14px;
    font-weight: 700;
    line-height: 1.35;
  }
  .page-type strong {
    font-weight: 800;
    color: var(--tb-accent);
  }

  .strip {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 6px;
    padding: 8px;
    border-radius: 14px;
    border: 1px solid var(--tb-border);
    background: var(--tb-surface);
  }
  .btn {
    min-width: 0;
    min-height: 52px;
    padding: 0 8px;
    border-radius: 12px;
    border: 1px solid transparent;
    background: transparent;
    color: var(--tb-text);
    font-size: 14px;
    font-weight: 800;
    font-family: inherit;
    cursor: pointer;
    transition: background 120ms ease, color 120ms ease, border-color 120ms ease;
  }
  .btn:hover {
    background: var(--tb-btn-hover);
  }
  .btn.pressed {
    background: var(--tb-btn-pressed-bg);
    border-color: var(--tb-btn-pressed-border);
    color: var(--tb-text);
  }
  .btn:focus-visible {
    outline: 3px solid var(--tb-accent);
    outline-offset: 2px;
  }
  .btn.soft {
    border-color: color-mix(in srgb, var(--tb-accent) 40%, transparent);
  }
  .btn.danger {
    border-color: color-mix(in srgb, var(--tb-danger-text) 40%, transparent);
    background: var(--tb-danger-bg);
    color: var(--tb-danger-text);
  }
  .btn.ghost {
    width: 100%;
    min-height: 48px;
    border-color: var(--tb-border);
    background: var(--tb-surface);
    color: var(--tb-text);
    font-weight: 800;
  }
  .btn.ghost:hover {
    background: var(--tb-accent-soft);
    border-color: color-mix(in srgb, var(--tb-accent) 40%, transparent);
  }
  .panel-title {
    margin: 6px 0 2px 2px;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.02em;
    color: var(--tb-muted);
  }

  @media (prefers-reduced-motion: reduce) {
    .btn, .dock { transition: none !important; }
  }
`;
