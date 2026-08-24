# Dastresa Summary API (Cloudflare Worker)

Proxies page-summary requests to Luma so the API key never ships inside the Chrome extension.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Liveness |
| `POST` | `/api/summarize` | `{ title, text, locale }` → `{ ok, summary }` |

Rate limit: ~30 requests / IP / hour (configurable).

## Local setup

```bash
cd server
npm install
cp .dev.vars.example .dev.vars
# put LUMA_API_KEY in .dev.vars
npm run dev
```

Worker listens on `http://127.0.0.1:8787` by default.

## Deploy

```bash
cd server
npx wrangler login
npx wrangler secret put LUMA_API_KEY
npm run deploy
```

Then set the Worker URL in the extension:

`src/core/constants/index.ts` → `SUMMARY_API.BASE_URL`
