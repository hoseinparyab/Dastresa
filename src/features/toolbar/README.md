# Accessibility Toolbar

**Status:** MVP

## Boundary

Floating, draggable, always visible chrome UI in Shadow DOM. Large touch targets (≥48×48). Commands only — no feature business logic.

## Controls

Reader · Read · Pause · Resume · Stop · Zoom · Contrast · Focus · Settings

## Public surface

- Implements `IFeature`
- Emits: `toolbar:command`, `toolbar:moved`

## Depends on

- Event Bus
- Settings (position persistence)

## Must not

- Import feature services; only emit commands
