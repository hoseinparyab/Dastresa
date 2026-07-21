# Storage

**Status:** MVP  
**Kind:** Infrastructure feature

## Boundary

Single persistence boundary over `chrome.storage.local`. Typed keys, Zod validation, `watch()` for rehydrate.

## Public surface

- Implements `IStorage`
- No product UI

## Depends on

- Core contracts / runtime adapters

## Must not

- Use `chrome.storage.sync` or network
- Collect analytics or telemetry
