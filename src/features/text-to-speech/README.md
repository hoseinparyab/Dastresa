# Text To Speech

**Status:** MVP + Persian neural voice

## Boundary

1. **persian-server** (default): Gradio synthesize API (`/synthesize`) via background worker  
2. **browser**: `SpeechSynthesis` fallback (Play / Pause / Resume / Stop)

Paragraph highlight + auto-scroll. Optional **auto-read on enable**.

## Public surface

- Implements `IFeature` + `ISpeechEngine`
- Emits: `speech:state`, `speech:paragraph`
- Listens: `reader:content-ready`, `toolbar:command`, `extension:activated`

## Depends on

- Background message `dastresa-persian-tts`
- `src/core/api/persian-tts.ts`
- Settings / Storage

## Must not

- Call Gradio auth from the page origin (cookies stay in background)
