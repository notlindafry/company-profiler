// Tiny in-memory TTL cache. Used to avoid re-running the expensive multi-minute,
// multi-search research pipeline for an identical request.
//
// NOTE: like the rate limiter, this is per-process. On serverless each warm
// instance has its own cache, so repeated lookups only hit it when they land on
// the same instance. It still removes a lot of duplicate cost for a low-traffic
// tool. Swap for Vercel KV if you want cross-instance cache hits.

type Entry<T> = { value: T; expiresAt: number };

const store = new Map<string, Entry<unknown>>();

export function cacheGet<T>(key: string): T | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() >= entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return entry.value as T;
}

export function cacheSet<T>(key: string, value: T, ttlMs: number): void {
  // Keep the map bounded; drop the oldest entry if it gets large.
  if (store.size >= 500) {
    const oldest = store.keys().next().value;
    if (oldest !== undefined) store.delete(oldest);
  }
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}
