/**
 * Remote AI boundary — implementations call a separate API source (server),
 * not an in-extension / local model.
 *
 * Existing path today: Page Summary → background → Dastresa-API-Core
 * (`docs.json` / SUMMARY_API) or optional user keys (Luma / Gemini).
 *
 * Core Understand / accessibility must work without calling this layer.
 * Future: simplify / explain / form-assist should plug in here the same way.
 */

export type AIProviderKind = 'dastresa' | 'luma' | 'gemini';

export interface SummaryInput {
  title: string;
  text: string;
  locale: 'fa' | 'en';
}

export interface SummaryResult {
  summary: string;
}

export interface SimplifyInput {
  text: string;
  locale: 'fa' | 'en';
  /** Optional semantic context from PageStructure / selection */
  context?: string;
}

export interface SimplifyResult {
  text: string;
}

/**
 * Contract for remote AI backends.
 * Implementations live outside the local semantics engine
 * (e.g. `page-summary` clients hitting SUMMARY_API).
 */
export interface AIProvider {
  readonly kind: AIProviderKind;
  summarize(input: SummaryInput): Promise<SummaryResult>;
  simplify?(input: SimplifyInput): Promise<SimplifyResult>;
}
