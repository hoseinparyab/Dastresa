# Page Summary

**Status:** free daily quota (standalone API) + optional Luma / Gemini key

## Flow

1. Toolbar **Summary** → content script extracts readable text
2. Background SW routes by `summaryProvider`:
   - **free** → HTTP `POST {SUMMARY_API.BASE_URL}/api/summarize`
   - **luma** → user's Luma key + Responses API
   - **gemini** → user's Gemini key + `generateContent`
3. Free path lives in the **separate** project [`Dastresa-Summary-API`](../../../Dastresa-Summary-API)

## Settings

- Provider: Free / Luma / Gemini
- API key per provider (browser-local only)
- Model picker for Luma or Gemini

## Backend (standalone)

See [`../Dastresa-Summary-API/README.md`](../../../Dastresa-Summary-API/README.md).
