# Page Summary

**Status:** MVP (free backend + optional custom provider)

## Flow

1. Toolbar **Summary** → content script extracts readable text
2. Background SW routes by `summaryProvider`:
   - **free** → Dastresa Summary API (`SUMMARY_API.BASE_URL/api/summarize`)
   - **custom** → user's OpenAI-compatible base URL + API key + any model
3. Free path: Cloudflare Worker holds `LUMA_API_KEY` and proxies to Luma
4. Custom path: Chat Completions (`/chat/completions`) or Responses (`/responses`)

## Settings (custom)

- API key (browser-local)
- Base URL (e.g. `https://api.openai.com/v1`, `https://dash.lumai.ir/api/v1`)
- Model id (free text)
- API style: `chat` | `responses`

## Backend

See `server/README.md`.
