export const TOOLBAR_CSS = `
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
    padding: 0;
    border-radius: 999px;
    overflow: hidden;
  }
  .dock:active { cursor: grabbing; }

  .chip {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 48px;
    padding-block: 0;
    padding-inline: 10px 6px;
    text-align: start;
  }
  .dock.collapsed .chip {
    /* Icon sits on inline-end (left in RTL) — no gap on that side */
    padding-block: 0;
    padding-inline-start: 12px;
    padding-inline-end: 0;
    gap: 10px;
  }
  .chip:focus-visible {
    outline: 2px solid #38bdf8;
    outline-offset: 2px;
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
    display: inline-flex;
    align-items: center;
    justify-content: center;
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
  .dock.collapsed .icon-btn {
    width: 48px;
    height: 48px;
    min-width: 48px;
    min-height: 48px;
    border-radius: 0;
    /* Match the pill’s outer curve on the free edge */
    border-start-end-radius: 999px;
    border-end-end-radius: 999px;
    background: rgba(56, 189, 248, 0.2);
  }
  .icon-btn svg {
    width: 22px;
    height: 22px;
    display: block;
  }
  .dock.collapsed .icon-btn svg {
    width: 24px;
    height: 24px;
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
  .btn.pressed {
    background: rgba(56, 189, 248, 0.22);
    border-color: rgba(56, 189, 248, 0.55);
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
