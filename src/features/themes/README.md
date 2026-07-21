# Themes

**Status:** MVP

## Boundary

Applies theme tokens: Normal, Dark, Light, High Contrast, Black/White, Yellow/Black, Large Cursor, Large Buttons. Dark mode first.

## Public surface

- Implements `IFeature` + contributes to `IStyleController`
- Emits: `theme:applied`

## Depends on

- Settings / Storage

## Must not

- Depend on Reader Mode or TTS
