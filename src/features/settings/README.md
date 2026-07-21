# Settings

**Status:** MVP

## Boundary

Zod schemas + React Hook Form UI (options/popup). Persists theme, speech, zoom, toolbar position, reader mode. Restore on load.

## Public surface

- Implements `IFeature`
- Emits: `settings:changed`
- Owns settings schema under `schema/`

## Depends on

- Storage (`IStorage`)

## Must not

- Write to `chrome.storage` directly (use Storage feature)
