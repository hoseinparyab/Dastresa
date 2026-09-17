/**
 * Site-key normalization for per-site preferences.
 * Strategy: hostname only, lowercase, strip leading "www."
 * Preserve non-default ports (e.g. localhost:3000).
 */
export function normalizeSiteKey(input: string): string {
  const raw = input.trim().toLowerCase();
  if (!raw) return '';

  try {
    const url = raw.includes('://') ? new URL(raw) : new URL(`https://${raw}`);
    let host = url.hostname.toLowerCase();
    if (host.startsWith('www.')) host = host.slice(4);

    if (url.port && url.port !== '80' && url.port !== '443') {
      return `${host}:${url.port}`;
    }
    return host;
  } catch {
    return raw.replace(/^www\./, '').replace(/\/$/, '');
  }
}
