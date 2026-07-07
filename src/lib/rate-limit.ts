const WINDOW_MS = 60_000;
const buckets = new Map<string, number[]>();
const MAX_TRACKED_KEYS = 5_000;

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterMs: number;
}

type UpstashPipelineResult = Array<{ result?: unknown; error?: string }>;

function localRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);

  if (hits.length >= limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterMs: windowMs - (now - hits[0]),
    };
  }

  hits.push(now);

  if (!buckets.has(key) && buckets.size >= MAX_TRACKED_KEYS) {
    const oldestKey = buckets.keys().next().value;
    if (oldestKey) buckets.delete(oldestKey);
  }

  buckets.set(key, hits);

  return { ok: true, remaining: limit - hits.length, retryAfterMs: 0 };
}

async function upstashRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return null;

  try {
    const response = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", key],
        ["PEXPIRE", key, windowMs],
      ]),
      cache: "no-store",
    });

    if (!response.ok) return null;

    const data = (await response.json()) as UpstashPipelineResult;
    const count = Number(data[0]?.result ?? 0);

    if (!Number.isFinite(count) || count <= 0) return null;

    return {
      ok: count <= limit,
      remaining: Math.max(limit - count, 0),
      retryAfterMs: count > limit ? windowMs : 0,
    };
  } catch {
    return null;
  }
}

export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs = WINDOW_MS,
): Promise<RateLimitResult> {
  const redisResult = await upstashRateLimit(key, limit, windowMs);
  if (redisResult) return redisResult;

  return localRateLimit(key, limit, windowMs);
}
