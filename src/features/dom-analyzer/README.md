# DOM Analyzer

**Status:** MVP  
**Kind:** Infrastructure feature (no UI)

## Boundary

Owns safe DOM inspection for other modules. Produces snapshots and readiness signals. Does not mutate page layout for product UX (Reader Mode owns extraction UI).

## Public surface

- Implements `IDomAnalyzer`
- Emits: `dom:ready`, `dom:changed` (debounced)

## Depends on

- `core/contracts`, `core/event-bus`

## Must not

- Import Reader, TTS, or Toolbar internals
- Perform network requests
