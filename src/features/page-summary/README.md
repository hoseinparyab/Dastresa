# Page Summary

**Status:** MVP (opt-in cloud)

## Boundary

Summarizes readable page text via Luma Responses API when the user taps **Summary**.

- API: `POST https://dash.lumai.ir/api/v1/responses`
- Auth: Bearer API key from `chrome.storage.local` secrets (not in settings broadcast)
- Default model: `openai/gpt-4o-mini`
- Text extraction reuses Readability path from Reader Mode

## Privacy

Page content leaves the device **only** when the user explicitly requests a summary. Core Dastresa tools remain local.
