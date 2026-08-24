/** Simple Cache-API rate limit (best-effort across isolates). */
export async function allowRequest(
  request: Request,
  limitPerHour: number,
): Promise<{ ok: true } | { ok: false; retryAfterSec: number }> {
  const ip = request.headers.get('CF-Connecting-IP') || 'local';
  const bucket = Math.floor(Date.now() / 3_600_000);
  const cacheKey = new Request(`https://dastresa-rate.local/${ip}/${bucket}`);
  const cache = caches.default;
  const existing = await cache.match(cacheKey);
  const count = existing ? Number(await existing.text()) || 0 : 0;

  if (count >= limitPerHour) {
    const retryAfterSec = 3_600 - Math.floor((Date.now() % 3_600_000) / 1000);
    return { ok: false, retryAfterSec };
  }

  await cache.put(
    cacheKey,
    new Response(String(count + 1), {
      headers: { 'Cache-Control': 'max-age=3600' },
    }),
  );
  return { ok: true };
}
