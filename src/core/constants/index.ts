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
  PAGE_SUMMARY: 'page-summary',
} as const;

export type FeatureId = (typeof FEATURE_IDS)[keyof typeof FEATURE_IDS];

export const STORAGE_KEYS = {
  SETTINGS: 'Dastresa.settings',
  ONBOARDING: 'Dastresa.onboarding',
  /** API keys and secrets — never broadcast to pages. */
  SECRETS: 'Dastresa.secrets',
} as const;

/** Luma Responses API (used only when user supplies their own key). */
export const LUMA_API = {
  BASE_URL: 'https://dash.lumai.ir/api/v1',
  DEFAULT_MODEL: 'openai/gpt-4o-mini',
} as const;

/**
 * Dastresa Summary backend (Cloudflare Worker).
 * Local: `cd server && npm run dev` → http://127.0.0.1:8787
 * After deploy: replace with your workers.dev / custom domain URL.
 */
export const SUMMARY_API = {
  BASE_URL: 'http://127.0.0.1:8787',
} as const;

/** Bump when tour content changes so returning users can see an updated intro. */
export const ONBOARDING_VERSION = 1;

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
  SUMMARY_STARTED: 'summary:started',
  SUMMARY_READY: 'summary:ready',
  SUMMARY_FAILED: 'summary:failed',
} as const;

export const HOST_ROOT_ID = 'Dastresa-root';
export const HOST_STYLE_ATTR = 'data-Dastresa';
