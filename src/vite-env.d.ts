/// <reference types="vite/client" />

declare module '@mozilla/readability' {
  export interface ReadabilityResult {
    title: string;
    byline?: string | null;
    content: string;
    textContent: string;
    length: number;
    excerpt?: string | null;
    siteName?: string | null;
  }

  export class Readability {
    constructor(document: Document, options?: { debug?: boolean; charThreshold?: number });
    parse(): ReadabilityResult | null;
  }
}
