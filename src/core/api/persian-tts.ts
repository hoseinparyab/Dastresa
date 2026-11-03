/**
 * Private Gradio Persian TTS (voice clone / synthesize).
 * Network calls must run from the extension background (auth cookies).
 */

export const PERSIAN_TTS = {
  BASE_URL: 'http://185.243.48.122:7860',
  SYNTHESIZE_PATH: '/gradio_api/call/synthesize',
  LOGIN_PATH: '/login',
  /** Defaults for Najino private endpoint — overridable via secrets. */
  DEFAULT_USERNAME: 'farsi',
  DEFAULT_PASSWORD: 'VrtLq4J4G2fIt6zwfX9r',
  DEFAULTS: {
    temperature: 0.3,
    eosThreshold: -2.0,
    maxTokens: 18,
    voiceSec: 5.0,
    joinSec: 0.15,
    pauseSec: 0.3,
  },
} as const;

export type PersianTtsAuth = {
  username: string;
  password: string;
};

export type PersianTtsResult = {
  /** data:audio/wav;base64,... for content-script playback */
  dataUrl: string;
  meta?: string;
};

type TokenCache = {
  cookie: string;
  /** epoch ms */
  at: number;
};

let tokenCache: TokenCache | null = null;

function pickCookie(setCookie: string[]): string {
  const parts: string[] = [];
  for (const raw of setCookie) {
    const pair = raw.split(';')[0]?.trim();
    if (!pair) continue;
    if (pair.startsWith('access-token-unsecure-') || pair.startsWith('access-token-')) {
      parts.push(pair);
    }
  }
  // Prefer unsecure token for plain HTTP origin.
  const unsecure = parts.find((p) => p.startsWith('access-token-unsecure-'));
  return unsecure ?? parts[0] ?? '';
}

async function login(auth: PersianTtsAuth): Promise<string> {
  if (tokenCache && Date.now() - tokenCache.at < 25 * 60 * 1000) {
    return tokenCache.cookie;
  }

  const body = new URLSearchParams({
    username: auth.username,
    password: auth.password,
  });
  const res = await fetch(`${PERSIAN_TTS.BASE_URL}${PERSIAN_TTS.LOGIN_PATH}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) {
    throw new Error(`persian_tts_login_${res.status}`);
  }

  const setCookie =
    typeof res.headers.getSetCookie === 'function'
      ? res.headers.getSetCookie()
      : [res.headers.get('set-cookie') ?? ''].filter(Boolean);

  const cookie = pickCookie(setCookie);
  if (!cookie) {
    throw new Error('persian_tts_login_no_cookie');
  }
  tokenCache = { cookie, at: Date.now() };
  return cookie;
}

function parseCompletePayload(streamText: string): {
  url?: string;
  meta?: string;
} {
  const blocks = streamText.split('\n\n');
  for (const block of blocks) {
    if (!block.includes('event: complete')) continue;
    const dataLine = block.split('\n').find((line) => line.startsWith('data: '));
    if (!dataLine) continue;
    const raw = dataLine.slice('data: '.length).trim();
    if (!raw || raw === 'null') continue;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) continue;
    const file = parsed[0] as { url?: string } | null;
    const meta = typeof parsed[1] === 'string' ? parsed[1] : undefined;
    return { url: file?.url, meta };
  }
  throw new Error('persian_tts_no_audio');
}

async function waitForAudioUrl(
  cookie: string,
  eventId: string,
): Promise<{ url: string; meta?: string }> {
  const res = await fetch(`${PERSIAN_TTS.BASE_URL}${PERSIAN_TTS.SYNTHESIZE_PATH}/${eventId}`, {
    headers: { Cookie: cookie },
  });
  if (!res.ok) {
    throw new Error(`persian_tts_poll_${res.status}`);
  }
  const text = await res.text();
  const { url, meta } = parseCompletePayload(text);
  if (!url) throw new Error('persian_tts_no_audio');
  return { url, meta };
}

async function audioUrlToDataUrl(cookie: string, url: string): Promise<string> {
  const res = await fetch(url, { headers: { Cookie: cookie } });
  if (!res.ok) throw new Error(`persian_tts_audio_${res.status}`);
  const buf = await res.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  const b64 = btoa(binary);
  const mime = res.headers.get('content-type') || 'audio/wav';
  return `data:${mime};base64,${b64}`;
}

export async function synthesizePersianSpeech(
  text: string,
  auth: PersianTtsAuth = {
    username: PERSIAN_TTS.DEFAULT_USERNAME,
    password: PERSIAN_TTS.DEFAULT_PASSWORD,
  },
): Promise<PersianTtsResult> {
  const trimmed = text.trim();
  if (!trimmed) throw new Error('persian_tts_empty');

  let cookie = await login(auth);
  const d = PERSIAN_TTS.DEFAULTS;
  const payload = {
    data: [
      trimmed,
      null,
      d.temperature,
      d.eosThreshold,
      d.maxTokens,
      d.voiceSec,
      d.joinSec,
      d.pauseSec,
    ],
  };

  let call = await fetch(`${PERSIAN_TTS.BASE_URL}${PERSIAN_TTS.SYNTHESIZE_PATH}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
    },
    body: JSON.stringify(payload),
  });

  if (call.status === 401 || call.status === 403) {
    tokenCache = null;
    cookie = await login(auth);
    call = await fetch(`${PERSIAN_TTS.BASE_URL}${PERSIAN_TTS.SYNTHESIZE_PATH}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
      },
      body: JSON.stringify(payload),
    });
  }

  if (!call.ok) {
    throw new Error(`persian_tts_call_${call.status}`);
  }

  const json = (await call.json()) as { event_id?: string };
  if (!json.event_id) throw new Error('persian_tts_no_event');

  const { url, meta } = await waitForAudioUrl(cookie, json.event_id);
  const dataUrl = await audioUrlToDataUrl(cookie, url);
  return { dataUrl, meta };
}

/** Split long paragraphs so Gradio stays responsive. */
export function chunkTextForTts(text: string, maxLen = 420): string[] {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  if (clean.length <= maxLen) return [clean];

  const parts: string[] = [];
  let rest = clean;
  while (rest.length > maxLen) {
    let cut = rest.lastIndexOf(' ', maxLen);
    if (cut < maxLen * 0.4) cut = maxLen;
    parts.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) parts.push(rest);
  return parts;
}
