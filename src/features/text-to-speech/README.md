# Text To Speech

**Status:** MVP

## Boundary

Browser `SpeechSynthesis` only. Play / Pause / Resume / Stop, voice, rate, pitch, volume. Paragraph highlight + auto-scroll. Persian voice priority.

## Public surface

- Implements `IFeature` + `ISpeechEngine`
- Emits: `speech:state`, `speech:paragraph`
- Listens: `reader:content-ready`, `toolbar:command`

## Depends on

- `IReadableContentProvider` (contract)
- Settings / Storage

## Must not

- Use cloud TTS or external APIs
