import { LUMA_API } from '@/core/constants';

export type LumaSummarizeParams = {
  apiKey: string;
  model: string;
  title: string;
  text: string;
  locale: 'en' | 'fa';
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

function buildPrompt(params: LumaSummarizeParams): string {
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

/** Call Luma Responses API (dash.lumai.ir). */
export async function summarizeWithLuma(params: LumaSummarizeParams): Promise<string> {
  const apiKey = params.apiKey.trim();
  if (!apiKey) throw new Error('missing_api_key');

  const response = await fetch(`${LUMA_API.BASE_URL}/responses`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      model: params.model || LUMA_API.DEFAULT_MODEL,
      input: buildPrompt(params),
    }),
  });

  const raw = await response.text();
  let json: unknown = null;
  try {
    json = raw ? JSON.parse(raw) : null;
  } catch {
    json = null;
  }

  if (!response.ok) {
    const message =
      json && typeof json === 'object' && 'error' in json
        ? String((json as LumaResponse).error?.message ?? raw)
        : raw || `HTTP ${response.status}`;
    throw new Error(message || `HTTP ${response.status}`);
  }

  const text = extractLumaText(json);
  if (!text) throw new Error('empty_summary');
  return text;
}
