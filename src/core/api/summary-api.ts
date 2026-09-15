import summaryApiDocs from '../../../docs.json';

export type SummaryApiDocs = typeof summaryApiDocs;

export type SummaryApiErrorCode =
  (typeof summaryApiDocs.endpoints.summarize.errors)[number];

/** Contract from root `docs.json` — free summary backend (Dastresa-API-Core). */
export const SUMMARY_API = {
  NAME: summaryApiDocs.name,
  VERSION: summaryApiDocs.version,
  BASE_URL: summaryApiDocs.baseUrl.replace(/\/+$/, ''),
  HEALTH_PATH: summaryApiDocs.endpoints.health.path,
  SUMMARIZE_PATH: summaryApiDocs.endpoints.summarize.path,
  ERRORS: summaryApiDocs.endpoints.summarize.errors,
} as const;

export function summaryApiUrl(path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${SUMMARY_API.BASE_URL}${clean}`;
}

export function isSummaryApiError(code: string): code is SummaryApiErrorCode {
  return (SUMMARY_API.ERRORS as readonly string[]).includes(code);
}
