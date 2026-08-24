const MAX_CHARS = 12_000;

type LumaOutputBlock = {
  type?: string;
  content?: Array<{ type?: string; text?: string }>;
};

export function truncateForSummary(text: string, max = MAX_CHARS): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max)}\n\n[…]`;
}

export function extractLumaText(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return '';
  const data = payload as { output?: LumaOutputBlock[] };
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

export function buildPrompt(opts: {
  title: string;
  text: string;
  locale: 'en' | 'fa';
}): string {
  const body = truncateForSummary(opts.text);
  if (opts.locale === 'fa') {
    return [
      'متن صفحه وب زیر را به فارسی، ساده و کوتاه خلاصه کن.',
      '۳ تا ۶ نکته بولت‌پوینت بنویس. فقط خلاصه، بدون مقدمه اضافه.',
      `عنوان: ${opts.title}`,
      '',
      body,
    ].join('\n');
  }
  return [
    'Summarize the webpage below in clear, short language.',
    'Use 3–6 bullet points. Summary only, no extra preamble.',
    `Title: ${opts.title}`,
    '',
    body,
  ].join('\n');
}

export async function summarizeWithLuma(opts: {
  apiKey: string;
  baseUrl: string;
  model: string;
  title: string;
  text: string;
  locale: 'en' | 'fa';
}): Promise<string> {
  const response = await fetch(`${opts.baseUrl.replace(/\/$/, '')}/responses`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      model: opts.model,
      input: buildPrompt(opts),
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
      json && typeof json === 'object' && json !== null && 'error' in json
        ? String((json as { error?: { message?: string } }).error?.message ?? raw)
        : raw || `HTTP ${response.status}`;
    throw new Error(message || `HTTP ${response.status}`);
  }

  const text = extractLumaText(json);
  if (!text) throw new Error('empty_summary');
  return text;
}
