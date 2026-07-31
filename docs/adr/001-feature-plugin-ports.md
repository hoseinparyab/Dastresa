# ADR-001: Feature Plugin + Ports & Adapters

## Status
Accepted

## Context
Dastresa is an MV3 accessibility extension with multiple entry points (content, background, popup, options) and growing feature set. We need a pattern that stays readable for a small team while allowing new capabilities without rewriting the core.

## Decision
Adopt **Feature Plugin modules** coordinated through **ports (contracts) + Event Bus**, with a thin composition root per runtime:

- Each capability lives under `src/features/<name>` and implements `IFeature`
- Cross-feature communication uses `IEventBus` or shared contracts — not direct feature-to-feature calls when avoidable
- Shared settings domain lives in `src/core/settings` so `core` never depends on `features`
- Persistence helpers stay unified: `SettingsService` (content) and `patchStoredSettings` (features with `IStorage`); popup/options use the same `mergeSettings` / `parseSettings` when writing

## Consequences
- Easier: add/disable features, test adapters, keep entry points thin
- Harder: must resist shortcuts (direct imports, duplicate merge logic, fat god files)
- Explicit non-goals for now: full Hexagonal ceremony, CQRS, microservices
