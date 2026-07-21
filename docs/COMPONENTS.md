# Component Documentation

## Accessibility Toolbar

- **Location:** `src/features/toolbar`
- **Mount:** Shadow DOM host `#Dastresa-toolbar-host`
- **Behavior:** Draggable; emits `toolbar:command` / `toolbar:moved`
- **A11y:** `role="toolbar"`, labeled buttons, ≥48×48 targets

## Settings Form

- **Location:** `src/features/settings/components/SettingsForm.tsx`
- **Used by:** Popup (compact) and Options (full)
- **Validation:** Zod `DastresaSettingsSchema` via React Hook Form
- **Persistence:** `chrome.storage.local` key `Dastresa.settings`

## Reader Overlay

- **Location:** `src/features/reader-mode`
- **Mount:** Shadow DOM dialog overlay
- **Source:** Mozilla Readability with DOM fallback

## Reading Focus

- **Location:** `src/features/reading-focus`
- **Keyboard:** `↑/↓` or `k/j`
- **Optional:** reading ruler follows pointer
