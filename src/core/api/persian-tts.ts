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

let loggedInAt = 0;

/**
 * Browsers forbid setting/reading the Cookie header from fetch, so we rely on the
 * browser cookie jar (credentials: 'include' + host permission) instead.
 */
async function login(auth: PersianTtsAuth): Promise<void> {
  if (loggedInAt && Date.now() - loggedInAt < 25 * 60 * 1000) return;

  const body = new URLSearchParams({
    username: auth.username,
    password: auth.password,
  });
  const res = await fetch(`${PERSIAN_TTS.BASE_URL}${PERSIAN_TTS.LOGIN_PATH}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error(`persian_tts_login_${res.status}`);
  }
  loggedInAt = Date.now();
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

async function waitForAudioUrl(eventId: string): Promise<{ url: string; meta?: string }> {
  const res = await fetch(`${PERSIAN_TTS.BASE_URL}${PERSIAN_TTS.SYNTHESIZE_PATH}/${eventId}`, {
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error(`persian_tts_poll_${res.status}`);
  }
  const text = await res.text();
  const { url, meta } = parseCompletePayload(text);
  if (!url) throw new Error('persian_tts_no_audio');
  return { url, meta };
}

async function audioUrlToDataUrl(url: string): Promise<string> {
  const res = await fetch(url, { credentials: 'include' });
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

  await login(auth);
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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include',
  });

  if (call.status === 401 || call.status === 403) {
    loggedInAt = 0;
    await login(auth);
    call = await fetch(`${PERSIAN_TTS.BASE_URL}${PERSIAN_TTS.SYNTHESIZE_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include',
    });
  }

  if (!call.ok) {
    throw new Error(`persian_tts_call_${call.status}`);
  }

  const json = (await call.json()) as { event_id?: string };
  if (!json.event_id) throw new Error('persian_tts_no_event');

  const { url, meta } = await waitForAudioUrl(json.event_id);
  const dataUrl = await audioUrlToDataUrl(url);
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
