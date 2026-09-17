# Dastresa — Architecture

Tagline: Make every website easier to read and use.

Offline accessibility enhancement layer for Chrome (Manifest V3). Not a screen reader. Not an AI assistant. No cloud.

## Goal

After the user **opts in** (popup Enable), any website can become easier to read and navigate. Fresh installs do **not** rewrite pages until activated.

**1.2.0 Understand:** the content script builds a local semantic model of the page (structure, type, forms) before assisting. Analysis stays on-device — no remote page content upload.

## Runtimes

| Surface | Role |
|---------|------|
| Service Worker | Message bridge (`open-options`), storage change heartbeat |
| Content Script | Product surface: themes, zoom, toolbar, reader, TTS, focus |
| Popup / Options | Configuration UI only |

## Boot sequence (content script)

1. Create `IStorage` + DI container + Event Bus
2. Initialize Storage + Settings (hydrate Zod-validated prefs)
3. If `extensionActive` and host not disabled (`disabledSites` / `sitePreferences.enabled=false`):
   - Critical: Dom Analyzer (semantic + page type + forms), Themes, Smart Zoom, Toolbar
   - Lazy: Reader Mode 2.0, Text To Speech, Reading Focus
4. Persist toolbar position / theme / zoom / focus / profile via `SettingsService` or `patchStoredSettings`

## Understand pipeline (1.2.0)

```text
DOM
 → Semantic Page Analyzer (`src/core/semantics`)
 → PageStructure (+ heading tree)
 → Page type detection (deterministic)
 → Form analysis (describe-only)
 → Event bus (`page:analyzed` / `page:type-detected` / `form:analyzed`)
 → Reader / Themes / Zoom consume structure or effective settings
```

- Targeted selectors only (no `querySelectorAll('*')` on every mutation)
- Debounced MutationObserver; short structure cache (~1.5s)
- `SETTINGS_SCHEMA_VERSION = 2` with `migrateSettings`

## Principles

- Feature-first packages under `src/features/` (see [ADR-001](adr/001-feature-plugin-ports.md))
- SOLID + dependency inversion via `src/core/contracts`
- Shared settings domain in `src/core/settings` (core must not import features)
- Cross-feature communication via Event Bus or interfaces only
- Lazy-load heavy modules; keep first paint of extension chrome fast
- Shadow DOM for toolbar + reader chrome
- `chrome.storage.local` only; Zod at the persistence boundary with **soft field recovery**
- Single settings merge/parse helpers; writes via `SettingsService` / `patchStoredSettings` / store using those helpers
- Content bootstrap: `src/content/index.ts` wires; lifecycle + messaging stay separate modules
- Future AI: remote API only (`src/core/ai/provider.ts` + `SUMMARY_API` / user keys) — never embedded in the local Understand core
- Future modules: extension points in `src/future/` — no implementation

## Shipped modules

DOM / Semantic Analyzer · Reader Mode 2.0 · Text To Speech · Smart Zoom · Themes · Reading Focus · Accessibility Toolbar · Accessibility Profiles · Per-site Preferences · Settings · Storage · Page Summary (optional provider)

## Future modules (slots only)

AI Simplifier · AI Copilot · AI Form Assistant · Voice Navigation · OCR Reader · Accessibility Scanner · Banking Assistant · Government Website Assistant · Cloud Sync · Accounts

## Key contracts

`IFeature`, `IEventBus`, `IStorage`, `IDomAnalyzer`, `ISemanticPageAnalyzer`, `IReadableContentProvider`, `ISpeechEngine`, `IStyleController`, `IModuleRegistry`, `IExtensionPoint`, `AIProvider` (remote API contract)

See also: [FOLDER_STRUCTURE.md](FOLDER_STRUCTURE.md), [MANIFEST.md](MANIFEST.md), [COMPONENTS.md](COMPONENTS.md), [BRAND.md](BRAND.md), [MVP_FEATURES.md](MVP_FEATURES.md).
