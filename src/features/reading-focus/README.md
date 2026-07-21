# Reading Focus

**Status:** MVP

## Boundary

Highlights current paragraph, dims surroundings, optional ruler, keyboard navigation,
mouse tracking, and a high-visibility colored cursor with tracking halo.

## Public surface

- Implements `IFeature`
- Emits: `focus:paragraph`
- Listens: `speech:paragraph`, `toolbar:command`, `settings:changed`

## Depends on

- DOM Analyzer (contract)
- Settings / Storage (`readingFocus`, `focusCursorColor`, `readingRuler`)

## Must not

- Own speech playback
