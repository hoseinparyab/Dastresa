import { summarizeWithLuma } from './luma';
import { allowRequest } from './rate-limit';

function json(data: unknown, status = 200, extraHeaders?: HeadersInit): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      ...extraHeaders,
    },
  });
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return json({ ok: true });
    }

    const url = new URL(request.url);
    if (request.method === 'GET' && url.pathname === '/health') {
      return json({ ok: true, service: 'dastresa-summary-api' });
    }

    if (request.method !== 'POST' || url.pathname !== '/api/summarize') {
      return json({ ok: false, error: 'not_found' }, 404);
    }

    const limit = Number(env.RATE_LIMIT_PER_DAY) || 5;
    const gate = await allowRequest(request, limit);
    if (!gate.ok) {
      return json(
        { ok: false, error: 'rate_limited', retryAfterSec: gate.retryAfterSec },
        429,
        { 'Retry-After': String(gate.retryAfterSec) },
      );
    }

    if (!env.LUMA_API_KEY?.trim()) {
      return json({ ok: false, error: 'server_misconfigured' }, 500);
    }

    let body: { title?: unknown; text?: unknown; locale?: unknown };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return json({ ok: false, error: 'invalid_json' }, 400);
    }

    const title = String(body.title ?? '').slice(0, 500);
    const text = String(body.text ?? '');
    const locale = body.locale === 'en' ? 'en' : 'fa';

    if (text.trim().length < 40) {
      return json({ ok: false, error: 'text_too_short' }, 400);
    }

    try {
      const summary = await summarizeWithLuma({
        apiKey: env.LUMA_API_KEY,
        baseUrl: env.LUMA_BASE_URL || 'https://dash.lumai.ir/api/v1',
        model: env.LUMA_MODEL || 'openai/gpt-4o-mini',
        title,
        text,
        locale,
      });
      return json({ ok: true, summary });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'summary_failed';
      return json({ ok: false, error: message }, 502);
    }
  },
} satisfies ExportedHandler<Env>;
