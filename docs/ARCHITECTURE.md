# Dastresa — Architecture

Tagline: Make every website easier to read and use.

Offline accessibility enhancement layer for Chrome (Manifest V3). Not a screen reader. Not an AI assistant. No cloud.

## Goal (MVP)

When the user opens any website, it immediately becomes easier to read and navigate.

## Runtimes

| Surface | Role |
|---------|------|
| Service Worker | Message bridge (`open-options`), storage change heartbeat |
| Content Script | Product surface: themes, zoom, toolbar, reader, TTS, focus |
| Popup / Options | Configuration UI only |

## Boot sequence (content script)

1. Create `IStorage` + DI container + Event Bus
2. Initialize critical features: Storage, Settings, DOM Analyzer, Themes, Smart Zoom, Toolbar
3. Lazy-load Reader Mode, Text To Speech, Reading Focus
4. Persist toolbar position on `toolbar:moved`

## Principles

- Feature-first packages under `src/features/`
- SOLID + dependency inversion via `src/core/contracts`
- Cross-feature communication via Event Bus or interfaces only
- Lazy-load heavy modules; keep first paint of extension chrome fast
- Shadow DOM for toolbar + reader chrome
- `chrome.storage.local` only; Zod at the persistence boundary
- Future modules: extension points in `src/future/` — no implementation

## MVP modules

DOM Analyzer · Reader Mode · Text To Speech · Smart Zoom · Themes · Reading Focus · Accessibility Toolbar · Settings · Storage

## Future modules (slots only)

AI Simplifier · AI Copilot · AI Form Assistant · Voice Navigation · OCR Reader · Accessibility Scanner · Banking Assistant · Government Website Assistant · Page Summary · Cloud Sync · User Profiles

## Key contracts

`IFeature`, `IEventBus`, `IStorage`, `IDomAnalyzer`, `IReadableContentProvider`, `ISpeechEngine`, `IStyleController`, `IModuleRegistry`, `IExtensionPoint`

See also: [FOLDER_STRUCTURE.md](FOLDER_STRUCTURE.md), [MANIFEST.md](MANIFEST.md), [COMPONENTS.md](COMPONENTS.md).
