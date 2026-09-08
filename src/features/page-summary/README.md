# Page Summary

**Status:** free daily quota + optional Luma / Gemini key

## Flow

1. Toolbar **Summary** → content script extracts readable text
2. Background SW routes by `summaryProvider`:
   - **free** → Dastresa Summary API (~5 / IP / day)
   - **luma** → user's Luma key + Responses API
   - **gemini** → user's Gemini key + `generateContent`
3. Free path: Cloudflare Worker holds `LUMA_API_KEY` and proxies to Luma

## Settings

- Provider: Free / Luma / Gemini
- API key per provider (browser-local)
- Model picker for Luma or Gemini

## Backend

See `server/README.md`.
