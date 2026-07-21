export const FEATURE_IDS = {
  STORAGE: 'storage',
  SETTINGS: 'settings',
  DOM_ANALYZER: 'dom-analyzer',
  READER_MODE: 'reader-mode',
  TEXT_TO_SPEECH: 'text-to-speech',
  SMART_ZOOM: 'smart-zoom',
  THEMES: 'themes',
  READING_FOCUS: 'reading-focus',
  TOOLBAR: 'toolbar',
} as const;

export type FeatureId = (typeof FEATURE_IDS)[keyof typeof FEATURE_IDS];

export const STORAGE_KEYS = {
  SETTINGS: 'Dastresa.settings',
} as const;

export const EVENTS = {
  SETTINGS_CHANGED: 'settings:changed',
  TOOLBAR_COMMAND: 'toolbar:command',
  TOOLBAR_MOVED: 'toolbar:moved',
  EXTENSION_EXITED: 'extension:exited',
  EXTENSION_ACTIVATED: 'extension:activated',
  READER_ACTIVATED: 'reader:activated',
  READER_DEACTIVATED: 'reader:deactivated',
  READER_CONTENT_READY: 'reader:content-ready',
  SPEECH_STATE: 'speech:state',
  SPEECH_PARAGRAPH: 'speech:paragraph',
  FOCUS_PARAGRAPH: 'focus:paragraph',
  THEME_APPLIED: 'theme:applied',
  ZOOM_APPLIED: 'zoom:applied',
  DOM_READY: 'dom:ready',
  DOM_CHANGED: 'dom:changed',
} as const;

export const HOST_ROOT_ID = 'Dastresa-root';
export const HOST_STYLE_ATTR = 'data-Dastresa';
