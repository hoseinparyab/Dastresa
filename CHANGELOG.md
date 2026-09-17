# Changelog

## 1.2.0 — Understand — 2026-09-17

### Understand layer
- Semantic Page Analyzer (`PageStructure`, landmarks, heading tree, articles, links, buttons)
- Deterministic page-type detection (ARTICLE / NEWS / FORM / …) with confidence + signals
- Form Analyzer (label association, ARIA, required, validation attrs) — describe only, no autofill
- Events: `page:analyzed`, `page:type-detected`, `form:analyzed`, `reader:structure-ready`, `profile:changed`

### Smart Reader 2.0
- TOC from headings, previous/next section, reading progress bar
- Combines Readability with semantic heading tree; FA/EN UI labels

### Accessibility profiles & site prefs
- Presets: Normal, Low vision, Elderly, Reading, High contrast, Custom
- `sitePreferences` overrides (theme/zoom/reader/focus) + `normalizeSiteKey`
- Settings schema v2 migration (preserves 1.1.x user config; keeps `disabledSites`)

### Architecture prep
- `AIProvider` interface stub only — core stays non-AI / local-first

## 1.1.1 — 2026-09-16

### Themes
- Google search pill and SERP chrome contrast fixes (incomplete inner bar, Show more fade, tab underlines)
- Safer theme scrub (no full-page style scan that crashed Search)

## 0.1.0 — MVP (2026-07-21)

### Product
- Offline Chrome MV3 accessibility layer (toolbar, themes, smart zoom, reader mode, TTS, reading focus)
- Opt-in activation — pages stay at browser defaults until the user enables Dastresa
- Safe Look defaults (`normal` theme; no forced large controls)
- Per-site disable from the popup
- Persian / English UI with RTL support

### Trust & brand
- Privacy policy draft for store hosting (`docs/PRIVACY.md`)
- Brand foundation and store listing copy (`docs/BRAND.md`, `docs/STORE_LISTING.md`)
- Extension icons refreshed to Dastresa navy/cyan mark

### Quality
- Settings hydrate before theme/zoom apply (no refresh flash of wrong defaults)
- Focus cursor elevates above modal dialogs (top layer / popover)
- Accessibility polish: RTL switch, larger touch targets, reduced-motion, higher contrast chrome
