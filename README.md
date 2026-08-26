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

Dastresa is an **offline-first** Chrome extension (Manifest V3) that adds a calm accessibility layer to any website. It helps older adults, low-vision users, and people with low digital literacy browse more independently.

This is **not** a screen reader. Core reading tools (themes, zoom, reader, TTS, focus, toolbar) run **locally** — no tracking, no analytics.

**Optional:** Page Summary can call a small Dastresa backend (or your own Luma key) **only when you tap Summary**.

> Brand, store copy, and privacy: [`docs/BRAND.md`](docs/BRAND.md) · [`docs/STORE_LISTING.md`](docs/STORE_LISTING.md) · [`docs/PRIVACY.md`](docs/PRIVACY.md)  
> Release steps: [`docs/RELEASE_CHECKLIST.md`](docs/RELEASE_CHECKLIST.md)

**Current version:** `1.0.0`

## MVP features

| Module | What it does |
|--------|----------------|
| Accessibility Toolbar | Floating, draggable, large touch targets |
| Smart Zoom | Text size and reading spacing |
| Themes | Opt-in dark / light / high-contrast looks |
| Reader Mode | Cleaner article view (Readability) |
| Text To Speech | Browser voices with paragraph highlight |
| Reading Focus | Dim distractions, ruler, high-visibility cursor |
| Page Summary | One-tap page summary (free daily quota or optional Luma key) |
| Settings | Persian / English · per-site disable · on-device storage |
| Onboarding | Short welcome tour after install |

**Safe defaults:** off until you Enable · Normal (browser) look · does not rewrite pages on install.

### Page Summary (opt-in)

| Mode | Behavior |
|------|----------|
| **Free (default)** | Uses the Dastresa Summary API (~**5 summaries / IP / day**) |
| **Own Luma key** | Optional key in Settings → calls Luma directly (your quota; bypasses free limit) |

- Page text is sent **only** when you use Summary.
- Free API key stays on the server (`server/` Cloudflare Worker), not inside the extension package.
- Details: [`src/features/page-summary/README.md`](src/features/page-summary/README.md) · [`server/README.md`](server/README.md)

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

### Local free Summary backend

```bash
npm run server:install
# put LUMA_API_KEY in server/.dev.vars (see server/.dev.vars.example)
npm run server:dev
```

Default URL: `http://127.0.0.1:8787` (see `SUMMARY_API.BASE_URL` in `src/core/constants/index.ts`).

After deploy, set that constant to your Worker URL.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite + CRX watch build |
| `npm run build` | Typecheck + production build |
| `npm run pack:mvp` | Zip `dist/` into `release/` for store upload |
| `npm run server:install` | Install Worker dependencies |
| `npm run server:dev` | Run Summary API locally (Wrangler) |
| `npm run server:deploy` | Deploy Summary API Worker |
| `npm run typecheck` | TypeScript only |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit / component / integration |
| `npm run test:e2e` | Playwright fixture smoke |
| `npm run test:a11y` | Accessibility invariant tests |

## Privacy

- No analytics or telemetry
- Settings and optional API keys stay on device (`chrome.storage.local`)
- Accessibility features do not need the network
- **Page Summary only:** when you tap Summary, page text goes to the free Dastresa backend **or** (if configured) Luma with your key
- Free tier is rate-limited; own Luma key is optional for more usage

Full policy: [`docs/PRIVACY.md`](docs/PRIVACY.md) *(update store privacy copy before release if Summary ships publicly)*

## Architecture notes

- Feature-plugin layout under `src/features/` with ports/adapters (see [`docs/adr/001-feature-plugin-ports.md`](docs/adr/001-feature-plugin-ports.md))
- Settings schema: `src/core/settings/`
- Summary proxy: `server/` (Cloudflare Worker)

## Docs

| Doc | Topic |
|-----|--------|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | How the extension is structured |
| [`docs/SETUP.md`](docs/SETUP.md) | Environment setup |
| [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) | Dev workflow |
| [`docs/BRAND.md`](docs/BRAND.md) | Brand foundation |
| [`docs/PRIVACY.md`](docs/PRIVACY.md) | Privacy policy |
| [`docs/STORE_LISTING.md`](docs/STORE_LISTING.md) | Chrome Web Store copy |
| [`docs/RELEASE_CHECKLIST.md`](docs/RELEASE_CHECKLIST.md) | Ship checklist |
| [`server/README.md`](server/README.md) | Summary API Worker |
| [`src/features/page-summary/README.md`](src/features/page-summary/README.md) | Page Summary feature |

## Publisher

Made by **[Najino Group](https://najino.com/)** — Digital Agency · [najino.com](https://najino.com/)

## License

[MIT](LICENSE) — Copyright (c) 2026 Najino Agency
