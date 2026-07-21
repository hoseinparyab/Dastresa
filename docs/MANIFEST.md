# Dastresa — Manifest V3

Canonical file: [`manifest.json`](../manifest.json) at the repo root.

Designed for `@crxjs/vite-plugin` (or equivalent): paths point at **source** entries; the bundler rewrites them into `dist/` at build time.

## Decisions

### Manifest V3 only
Service worker background (no persistent background page). Compatible with Chrome Web Store requirements.

### Minimal permissions
| Permission | Why |
|------------|-----|
| `storage` | Persist theme, speech, zoom, toolbar position, reader mode via `chrome.storage.local` |
| `host_permissions` `http(s)://*/*` | Inject the accessibility layer on any website (product mission) |

**Not requested (on purpose):** `tabs` (broad), `scripting` (static content_scripts cover MVP), `identity`, `webRequest`, remote code hosts.

No analytics, telemetry, or external endpoints — CSP locks extension pages to `'self'`.

### Content script
- Matches all http/https pages
- `run_at: document_idle` — DOM available; avoids blocking first paint
- `all_frames: false` — main frame only in MVP (iframes later if needed)
- Single bootstrap: `src/content/index.ts` → lazy-loads features

### Background service worker
- Module worker: `src/background/index.ts`
- Owns registry bootstrap coordination, storage change fan-out, message bridge
- Must stay lightweight (MV3 idle termination)

### UI surfaces
| Surface | Path | Role |
|---------|------|------|
| Toolbar action popup | `src/popup/index.html` | Quick controls |
| Options | `src/options/index.html` (`open_in_tab: true`) | Full settings (AAA-friendly large layout) |

Page product UI (floating toolbar, reader chrome) lives in the **content script Shadow DOM**, not in the popup.

### i18n
`default_locale: "en"` with `_locales/en` and `_locales/fa` stubs. Persian is a first-class locale for RTL + TTS priority; UI strings will migrate to `chrome.i18n` in Core/Settings steps.

### Version
`0.1.0` — MVP release candidate. See `CHANGELOG.md` and `docs/RELEASE_CHECKLIST.md`.

### Icons
Source files live in `public/icons/icon-{16,32,48,128}.png` (Dastresa navy/cyan mark). Manifest references `icons/...` because Vite copies `public/` to the extension root. Brand master: `docs/brand/icon-master.png`.

## Security posture

- Offline-only product surface
- No remotely hosted scripts
- CSP on extension pages
- Storage is local device only (`chrome.storage.local` in implementation — not sync)

## Load unpacked (after build)

1. `npm run build` → output in `dist/`
2. `chrome://extensions` → Developer mode → Load unpacked → select `dist/`
3. Built manifest inside `dist/` is what Chrome reads
4. For store upload: `npm run pack:mvp` → zip in `release/`
