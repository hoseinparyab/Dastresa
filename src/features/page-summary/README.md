# Page Summary

**Status:** MVP — free daily quota + optional Luma key

## Flow

1. Toolbar **Summary** → content script extracts readable text
2. Background SW:
   - **No user key** → Dastresa Summary API (free, ~5 / IP / day)
   - **User Luma key saved** → direct Luma Responses API (user's own quota)
3. Free path: Cloudflare Worker holds `LUMA_API_KEY` and proxies to Luma

## Settings

- Optional Luma API key (browser-local) — bypasses free daily limit
- Model picker shown only when a key is saved

## Backend

See `server/README.md`.
