# Development Guide

## Principles

1. Features are isolated packages under `src/features/`
2. Cross-feature communication uses `IEventBus` or shared contracts in `src/core/contracts`
3. Never import another feature’s `services/` or `components/` directly
4. Persist only through the Storage feature / `IStorage`
5. Keep the content-script critical path small; lazy-load Reader / TTS / Focus

## Adding a feature

1. Create `src/features/<id>/` with `feature.ts` / `index.ts` implementing `IFeature`
2. Register in `src/content/index.ts` (critical or lazy)
3. Document events in the feature `README.md`
4. Add unit tests under `__tests__/`

## UI surfaces

| Surface | Path | Notes |
|---------|------|------|
| Page toolbar | `src/features/toolbar` | Shadow DOM |
| Popup | `src/popup` | Compact settings |
| Options | `src/options` | Full settings (RHF + Zod) |

## Styling

- Tailwind for popup/options
- Inline / injected CSS variables for host-page Zoom & Themes
- Animations ≤ 150ms; respect `prefers-reduced-motion`

## Commits

Conventional Commits enforced by Commitlint:

```text
feat: add reading ruler toggle
fix: resume TTS after pause
chore: bump vite
```
