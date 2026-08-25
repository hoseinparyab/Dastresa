/** Daily Cache-API rate limit (best-effort across isolates). */
export async function allowRequest(
  request: Request,
  limitPerDay: number,
): Promise<{ ok: true } | { ok: false; retryAfterSec: number }> {
  const ip = request.headers.get('CF-Connecting-IP') || 'local';
  const dayMs = 86_400_000;
  const bucket = Math.floor(Date.now() / dayMs);
  const cacheKey = new Request(`https://dastresa-rate.local/${ip}/day/${bucket}`);
  const cache = caches.default;
  const existing = await cache.match(cacheKey);
  const count = existing ? Number(await existing.text()) || 0 : 0;

  if (count >= limitPerDay) {
    const retryAfterSec = dayMs / 1000 - Math.floor((Date.now() % dayMs) / 1000);
    return { ok: false, retryAfterSec };
  }

  await cache.put(
    cacheKey,
    new Response(String(count + 1), {
      headers: { 'Cache-Control': 'max-age=86400' },
    }),
  );
  return { ok: true };
}
