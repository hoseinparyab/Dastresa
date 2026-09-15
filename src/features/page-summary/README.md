# Page Summary

**Status:** free daily quota via `docs.json` API + optional Luma / Gemini key

## Free API contract

Source of truth: [`docs.json`](../../../docs.json)

| Field | Value |
|-------|--------|
| Base URL | `docs.json` → `baseUrl` (default `http://127.0.0.1:8787`) |
| Summarize | `POST /api/summarize` |
| Health | `GET /health` |

Client: `src/core/api/summary-api.ts` → `summarizeViaBackend()`

Backend project: [`../Dastresa-API-Core`](../../../Dastresa-API-Core)

## Flow

1. Toolbar **Summary** → extract readable text
2. Background SW by `summaryProvider`:
   - **free** → `POST {baseUrl}/api/summarize` (docs.json)
   - **luma** → user Luma key
   - **gemini** → user Gemini key

## Settings

- Provider: Free / Luma / Gemini
- Keys stay in `chrome.storage.local` only
