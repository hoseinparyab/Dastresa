export const FUTURE_EXTENSION_POINTS = [
  { id: 'ai-simplifier', capability: 'content-simplification', status: 'future' as const },
  { id: 'ai-copilot', capability: 'guided-assistance', status: 'future' as const },
  { id: 'ai-form-assistant', capability: 'form-assistance', status: 'future' as const },
  { id: 'voice-navigation', capability: 'voice-control', status: 'future' as const },
  { id: 'ocr-reader', capability: 'ocr', status: 'future' as const },
  { id: 'accessibility-scanner', capability: 'audit', status: 'future' as const },
  { id: 'banking-assistant', capability: 'vertical-banking', status: 'future' as const },
  {
    id: 'government-website-assistant',
    capability: 'vertical-government',
    status: 'future' as const,
  },
  { id: 'page-summary', capability: 'summary', status: 'future' as const },
  { id: 'cloud-sync', capability: 'sync', status: 'future' as const },
  { id: 'user-profiles', capability: 'profiles', status: 'future' as const },
] as const;

export type FutureExtensionPointId = (typeof FUTURE_EXTENSION_POINTS)[number]['id'];
