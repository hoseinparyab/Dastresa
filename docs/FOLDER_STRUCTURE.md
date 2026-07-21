# Dastresa — Folder Structure

Feature-first layout for a Manifest V3 Chrome Extension that can grow into a commercial Accessibility SaaS without rewriting the MVP.

## Tree

```text
Dastresa-Extension/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   └── workflows/                 # lint, typecheck, build, test
├── .husky/                        # git hooks (Step: tooling)
├── _locales/                      # chrome.i18n (en, fa)
├── docs/                          # architecture & guides
├── manifest.json                  # MV3 source manifest (CRX/Vite)
├── public/
│   └── icons/                     # extension icons → dist/icons
├── scripts/                       # build / release helpers
├── src/
│   ├── background/                # MV3 service worker entry
│   ├── content/                   # content-script bootstrap + mount
│   ├── popup/                     # quick controls (React)
│   ├── options/                   # full settings page (React)
│   ├── assets/
│   │   ├── fonts/
│   │   └── styles/                # global tokens only
│   ├── core/                      # shared kernel (no feature UI)
│   │   ├── contracts/             # interfaces (IFeature, IStorage, …)
│   │   ├── di/                    # lightweight composition root
│   │   ├── event-bus/             # typed pub/sub
│   │   ├── module-registry/       # register + lazy load features
│   │   ├── extension-points/      # slots for future modules
│   │   ├── runtime/               # boot context, env adapters
│   │   ├── types/                 # shared domain types
│   │   ├── utils/                 # pure helpers
│   │   └── constants/             # IDs, event names, storage keys
│   ├── shared/                    # reusable UI/lib (not features)
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── styles/
│   │   ├── i18n/                  # en + fa (RTL)
│   │   ├── a11y/                  # focus, announcements, AAA helpers
│   │   └── testing/               # test doubles / render helpers
│   ├── features/                  # MVP modules (isolated)
│   │   ├── dom-analyzer/
│   │   ├── reader-mode/
│   │   ├── text-to-speech/
│   │   ├── smart-zoom/
│   │   ├── themes/
│   │   ├── reading-focus/
│   │   ├── toolbar/
│   │   ├── settings/
│   │   └── storage/
│   └── future/                    # extension points ONLY (no impl)
│       ├── ai-simplifier/
│       ├── ai-copilot/
│       ├── ai-form-assistant/
│       ├── voice-navigation/
│       ├── ocr-reader/
│       ├── accessibility-scanner/
│       ├── banking-assistant/
│       ├── government-website-assistant/
│       ├── page-summary/
│       ├── cloud-sync/
│       └── user-profiles/
└── tests/
    ├── unit/
    ├── integration/
    ├── e2e/                       # Playwright
    ├── a11y/
    └── fixtures/pages/
```

## Feature package convention

Every MVP feature under `src/features/<name>/` follows the same shape:

```text
<feature>/
├── index.ts                 # public API only (exports + register())
├── README.md                # boundary, events, dependencies
├── contracts.ts             # feature-local ports (optional)
├── feature.ts               # IFeature implementation
├── services/                # business logic (no React)
├── components/              # UI (when needed)
├── styles/                  # scoped / Shadow DOM styles
├── schema/                  # Zod (settings feature)
└── __tests__/               # unit + feature tests
```

Rules:

1. Import other features **only** via `core/contracts` or the Event Bus.
2. Never import sibling `services/` or `components/` from another feature.
3. `index.ts` is the only public surface used by the module registry.
4. Each feature must support `enable()` / `disable()` independently.

## Runtime ownership

| Path | Owns |
|------|------|
| `src/background/` | Lifecycle, cross-tab storage fan-out, message bridge |
| `src/content/` | Page product surface: boot, Shadow host, feature mount |
| `src/popup/` | Compact controls; emits commands / opens options |
| `src/options/` | Full Settings UI (RHF + Zod + Zustand session state) |
| `src/core/` | Contracts, bus, registry, DI — zero product UI |
| `src/features/*` | Product capabilities |
| `src/future/*` | Typed stubs + `EXTENSION_POINT.md` only |
| `src/shared/*` | Cross-cutting UI/a11y/i18n without domain coupling |

## Dependency direction

```text
popup / options / content / background
            ↓
         features
            ↓
       shared + core
            ↓
     browser APIs (via adapters)
```

`future/*` must not be imported by MVP features. Core may list their extension-point IDs only.

## Why this layout

- **Feature-first** → SaaS verticals (banking, government) become new packages later.
- **`core/contracts`** → dependency inversion; swap TTS engine or storage without rewrites.
- **`future/`** → keeps roadmap visible without polluting MVP bundles (tree-shake / never import).
- **Colocated `__tests__`** → modules stay independently verifiable.
- **Thin entry folders** (`background`, `content`, …) → clear MV3 surfaces for Vite multi-page build.
