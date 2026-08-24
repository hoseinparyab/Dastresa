# Page Summary

**Status:** MVP (opt-in cloud via backend)

## Flow

1. Toolbar **Summary** → content script extracts readable text
2. Background SW calls **Dastresa Summary API** (`SUMMARY_API.BASE_URL/api/summarize`)
3. Cloudflare Worker holds `LUMA_API_KEY` and proxies to Luma Responses API
4. Optional: user custom key in Settings → direct Luma call (skips backend)

## Backend

See `server/README.md`.
