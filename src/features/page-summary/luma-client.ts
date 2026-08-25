import { LUMA_API } from '@/core/constants';

export type SummaryLocale = 'en' | 'fa';

export type CustomSummarizeParams = {
  apiKey: string;
  baseUrl: string;
  model: string;
  apiStyle: 'chat' | 'responses';
  title: string;
  text: string;
  locale: SummaryLocale;
};

type LumaOutputBlock = {
  type?: string;
  role?: string;
  content?: Array<{ type?: string; text?: string }>;
};

type LumaResponse = {
  status?: string;
  output?: LumaOutputBlock[];
  error?: { message?: string };
};

const MAX_CHARS = 12_000;

export function truncateForSummary(text: string, max = MAX_CHARS): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max)}\n\n[…]`;
}

export function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, '');
}

export function extractLumaText(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return '';
  const data = payload as LumaResponse;
  const parts: string[] = [];
  for (const block of data.output ?? []) {
    if (block.type !== 'message') continue;
    for (const item of block.content ?? []) {
      if (item.type === 'output_text' && item.text?.trim()) {
        parts.push(item.text.trim());
      }
    }
  }
  return parts.join('\n\n').trim();
}

export function extractChatText(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return '';
  const choices = (payload as { choices?: Array<{ message?: { content?: unknown } }> }).choices;
  const content = choices?.[0]?.message?.content;
  if (typeof content === 'string') return content.trim();
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') return part;
        if (part && typeof part === 'object' && 'text' in part) {
          return String((part as { text?: string }).text ?? '');
        }
        return '';
      })
      .join('')
      .trim();
  }
  return '';
}

function buildPrompt(params: { title: string; text: string; locale: SummaryLocale }): string {
  const body = truncateForSummary(params.text);
  if (params.locale === 'fa') {
    return [
      'متن صفحه وب زیر را به فارسی، ساده و کوتاه خلاصه کن.',
      '۳ تا ۶ نکته بولت‌پوینت بنویس. فقط خلاصه، بدون مقدمه اضافه.',
      `عنوان: ${params.title}`,
      '',
      body,
    ].join('\n');
  }
  return [
    'Summarize the webpage below in clear, short language.',
    'Use 3–6 bullet points. Summary only, no extra preamble.',
    `Title: ${params.title}`,
    '',
    body,
  ].join('\n');
}

async function parseJsonResponse(response: Response): Promise<unknown> {
  const raw = await response.text();
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return raw;
  }
}

function errorMessage(json: unknown, fallback: string): string {
  if (json && typeof json === 'object' && 'error' in json) {
    const err = (json as { error?: { message?: string } | string }).error;
    if (typeof err === 'string') return err;
    if (err?.message) return err.message;
  }
  return fallback;
}

/** Call any OpenAI-compatible provider with the user's own key + model. */
export async function summarizeWithCustomProvider(params: CustomSummarizeParams): Promise<string> {
  const apiKey = params.apiKey.trim();
  if (!apiKey) throw new Error('missing_api_key');

  const base = normalizeBaseUrl(params.baseUrl || LUMA_API.BASE_URL);
  const prompt = buildPrompt(params);
  const model = params.model.trim() || LUMA_API.DEFAULT_MODEL;
  const style = params.apiStyle === 'responses' ? 'responses' : 'chat';

  const url =
    style === 'responses' ? `${base}/responses` : `${base}/chat/completions`;

  const body =
    style === 'responses'
      ? { model, input: prompt }
      : {
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
        };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  const json = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(errorMessage(json, `HTTP ${response.status}`));
  }

  const text =
    style === 'responses' ? extractLumaText(json) : extractChatText(json);
  if (!text) throw new Error('empty_summary');
  return text;
}

/** @deprecated use summarizeWithCustomProvider */
export async function summarizeWithLuma(
  params: Omit<CustomSummarizeParams, 'baseUrl' | 'apiStyle'> & { baseUrl?: string },
): Promise<string> {
  return summarizeWithCustomProvider({
    ...params,
    baseUrl: params.baseUrl || LUMA_API.BASE_URL,
    apiStyle: 'responses',
  });
}

/** Call Dastresa summary backend (API key stays on the server). */
export async function summarizeViaBackend(params: {
  baseUrl: string;
  title: string;
  text: string;
  locale: SummaryLocale;
}): Promise<string> {
  const response = await fetch(`${params.baseUrl.replace(/\/$/, '')}/api/summarize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      title: params.title,
      text: truncateForSummary(params.text),
      locale: params.locale,
    }),
  });

  const json = await parseJsonResponse(response);
  if (!response.ok) {
    const error = errorMessage(json, `HTTP ${response.status}`);
    if (error === 'rate_limited') throw new Error('rate_limited');
    throw new Error(error);
  }

  const summary =
    json && typeof json === 'object' && json !== null && 'summary' in json
      ? String((json as { summary?: string }).summary ?? '')
      : '';
  if (!summary.trim()) throw new Error('empty_summary');
  return summary.trim();
}
