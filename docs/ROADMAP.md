# Roadmap

## Shipped

### MVP 0.1.0 / 1.1.1
- Reader Mode, TTS, Smart Zoom, Themes, Reading Focus, Toolbar, Settings, Storage
- Opt-in activation + safe Normal defaults
- Per-site disable (`disabledSites`)
- Persian / English UI · Offline-only Chrome MV3

### 1.2.0 — Understand (current)
- Semantic Page Analyzer + heading tree
- Deterministic page-type detection
- Form Analyzer (describe-only)
- Smart Reader 2.0 (TOC, section nav, progress)
- Accessibility profiles + `sitePreferences` + settings migration v2
- AI provider interface stub (no AI dependency in core)

## Near-term (after 1.2.0 trust)

- Richer voice picker UI
- Deeper per-site Look UI (local only)
- Incremental semantic invalidation for large SPAs
- Extension Playwright e2e on real pages
- Hosted privacy policy + store screenshots maintenance

## Later (not brand claims)

Engineering extension points only — **do not advertise** until productized:

See `src/future/*/EXTENSION_POINT.md` and `src/core/ai/provider.ts`:

- AI Simplifier / Copilot / Form Assistant
- Voice Navigation, OCR Reader
- Accessibility Scanner
- Banking & Government assistants
- Cloud Sync & Accounts

These remain unimplemented and must not appear in store copy or marketing.
