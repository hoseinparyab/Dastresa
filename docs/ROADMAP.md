# Roadmap

## MVP 0.1.0 — release candidate

Shipped for public / tester distribution:

- Reader Mode, TTS, Smart Zoom, Themes, Reading Focus, Toolbar, Settings, Storage
- Opt-in activation + safe Normal defaults
- Per-site disable
- Persian / English UI
- Offline-only Chrome MV3 — brand promise locked in `docs/BRAND.md`

**Release package:** see `docs/RELEASE_CHECKLIST.md` and `npm run pack:mvp`.

## Near-term (after MVP trust is proven)

- Richer voice picker UI
- Deeper per-site Look profiles (local only)
- Improved Reader fallback heuristics
- Extension Playwright e2e on real pages
- Hosted privacy policy + store screenshots maintenance

## Later (not MVP brand claims)

Engineering extension points only — **do not advertise** until productized:

See `src/future/*/EXTENSION_POINT.md`:

- AI Simplifier / Copilot / Form Assistant
- Voice Navigation, OCR Reader
- Accessibility Scanner
- Banking & Government assistants
- Page Summary
- Cloud Sync & User Profiles

These remain unimplemented and must not appear in store copy or marketing.
