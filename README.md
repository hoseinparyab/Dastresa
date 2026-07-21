# Dastresa

**[English](README.md)** · **[فارسی](README.fa.md)**

<p align="center">
  <img src="docs/brand/store-icon-128.png" alt="Dastresa logo" width="96" height="96" />
  &nbsp;&nbsp;&nbsp;
  <img src="docs/brand/najino-logo.svg" alt="Najino Group — Digital Agency" height="96" />
</p>

<p align="center">
  <strong>Dastresa</strong> by <a href="https://najino.com/">Najino Group</a>
</p>

**Make every website easier to read and use.**

Dastresa is an offline Chrome extension (Manifest V3) that adds a calm accessibility layer to any website. It helps older adults, low-vision users, and people with low digital literacy browse more independently.

This is **not** a screen reader and **not** an AI assistant. Everything runs locally on your device. No cloud. No tracking. No external APIs.

> Brand, store copy, and privacy: [`docs/BRAND.md`](docs/BRAND.md) · [`docs/STORE_LISTING.md`](docs/STORE_LISTING.md) · [`docs/PRIVACY.md`](docs/PRIVACY.md)  
> Release steps: [`docs/RELEASE_CHECKLIST.md`](docs/RELEASE_CHECKLIST.md)

## MVP features

| Module | What it does |
|--------|----------------|
| Accessibility Toolbar | Floating, draggable, large touch targets |
| Smart Zoom | Text size and reading spacing |
| Themes | Opt-in dark / light / high-contrast looks |
| Reader Mode | Cleaner article view (Readability) |
| Text To Speech | Browser voices with paragraph highlight |
| Reading Focus | Dim distractions, ruler, high-visibility cursor |
| Settings | Persian / English · per-site disable · on-device storage |

**Safe defaults:** off until you Enable · Normal (browser) look · does not rewrite pages on install.

## Quick start

```bash
npm install
npm run build
```

Then in Chrome:

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. **Load unpacked** → select the `dist/` folder
4. Open the popup → **Enable Dastresa**
5. Use the on-page toolbar

Development watch mode:

```bash
npm run dev
```

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite + CRX watch build |
| `npm run build` | Typecheck + production build |
| `npm run pack:mvp` | Zip `dist/` into `release/` for store upload |
| `npm run typecheck` | TypeScript only |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit / component / integration |
| `npm run test:e2e` | Playwright fixture smoke |
| `npm run test:a11y` | Accessibility invariant tests |

## Privacy

- No analytics or telemetry
- No user data collection by Dastresa servers (there are none)
- No network requests from extension feature code
- Settings stay on device (`chrome.storage.local`)

Full policy: [`docs/PRIVACY.md`](docs/PRIVACY.md)

## Docs

| Doc | Topic |
|-----|--------|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | How the extension is structured |
| [`docs/BRAND.md`](docs/BRAND.md) | Brand foundation |
| [`docs/PRIVACY.md`](docs/PRIVACY.md) | Privacy policy |
| [`docs/STORE_LISTING.md`](docs/STORE_LISTING.md) | Chrome Web Store copy |
| [`docs/RELEASE_CHECKLIST.md`](docs/RELEASE_CHECKLIST.md) | Ship checklist |

## Publisher

Made by **[Najino Group](https://najino.com/)** — Digital Agency · [najino.com](https://najino.com/)

## License

[MIT](LICENSE) — Copyright (c) 2026 Najino Agency
