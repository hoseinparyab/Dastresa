# Reader Mode

**Status:** MVP

## Boundary

Extracts readable content via Mozilla Readability. Removes ads, chrome, popups, sidebars. Fallback when Readability fails.

## Public surface

- Implements `IFeature` + `IReadableContentProvider`
- Emits: `reader:activated`, `reader:deactivated`, `reader:content-ready`

## Depends on

- DOM Analyzer (via contract)
- Storage / Settings (via bus + storage)

## Must not

- Call SpeechSynthesis directly (TTS consumes content events)
