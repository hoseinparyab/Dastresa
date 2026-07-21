# Dastresa

**Make every website easier to read and use.**

Dastresa is an offline Chrome extension (Manifest V3) that adds an accessibility layer to any website. It helps elderly users, low-vision users, and people with low digital literacy browse independently.

This is **not** a screen reader and **not** an AI assistant. Everything runs locally. No cloud. No tracking. No external APIs.

## MVP features

| Module | What it does |
|--------|----------------|
| Reader Mode | Mozilla Readability article view (ads/chrome stripped) |
| Text To Speech | Browser `SpeechSynthesis` with paragraph highlight |
| Smart Zoom | Text/image size, spacing, content width via CSS variables |
| Themes | Dark-first themes + high contrast / large cursor / large buttons |
| Reading Focus | Highlight current paragraph, dim surroundings, optional ruler |
| Accessibility Toolbar | Floating, draggable, 48×48+ touch targets |
| Settings + Storage | Persisted in `chrome.storage.local` (Zod-validated) |

## Quick start

```bash
npm install
npm run dev
```

Then in Chrome:

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. **Load unpacked** → select the `dist/` folder (created by `dev`/`build`)
4. Open any `http(s)` page — the Dastresa toolbar should appear

Production build:

```bash
npm run build
```

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite + CRX watch build |
| `npm run build` | Typecheck + production build |
| `npm run typecheck` | TypeScript only |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit/component/integration |
| `npm run test:e2e` | Playwright fixture smoke |
| `npm run test:a11y` | Accessibility invariant tests |

## Architecture

Feature-first modules under `src/features/` communicate through `src/core` contracts and an Event Bus. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/FOLDER_STRUCTURE.md](docs/FOLDER_STRUCTURE.md).

## Privacy

- No analytics / telemetry
- No user data collection
- No network requests from extension code
- Settings stay on device (`chrome.storage.local`)

## License

[MIT](LICENSE)
