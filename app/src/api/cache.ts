/**
 * Lightweight in-memory API response cache.
 *
 * Why not React Query / SWR?
 * ─────────────────────────
 * Adding a heavyweight library for one problem is overkill when the fix is
 * a 60-line module. This cache solves the most painful case: navigating back
 * to a page you already loaded fetches the backend again even though the data
 * is 30 seconds old and almost certainly unchanged.
 *
 * Strategy: stale-while-revalidate
 * ─────────────────────────────────
 * • Data is served instantly from cache if it's fresh (< TTL).
 * • If stale, cached data is returned IMMEDIATELY while a background refresh
 *   runs silently — the UI never blocks waiting for fresh data.
 * • Cache is keyed by string, scoped to the JS session (clears on page reload).
 *
 * TTL defaults:
 * • Dashboard stats: 30 s   (frequently changing, small payload)
 * • Member list:     60 s   (large payload, changes less often)
 * • Member profile:  30 s   (must feel fresh after a redemption)
 * • Membership types / offers: 120 s (config data, rarely changes)
 */

interface CacheEntry<T> {
  data: T;
  ts: number;       // timestamp of the last successful fetch
  fetching: boolean; // true while a background refresh is in-flight
}

const store = new Map<string, CacheEntry<unknown>>();

/** Default TTL by key pattern (ms). Falls back to 60 000 if no pattern matches. */
const TTL_MAP: { pattern: RegExp; ttl: number }[] = [
  { pattern: /dashboard/, ttl: 30_000 },
  { pattern: /member\/[^/]+$/, ttl: 30_000 },  // single member profile
  { pattern: /members$/, ttl: 60_000 },          // full member list
  { pattern: /membership-types/, ttl: 120_000 },
  { pattern: /offers/, ttl: 120_000 },
  { pattern: /rewards/, ttl: 120_000 },
  { pattern: /reports/, ttl: 60_000 },
];

function ttlFor(key: string): number {
  for (const { pattern, ttl } of TTL_MAP) {
    if (pattern.test(key)) return ttl;
  }
  return 60_000;
}

/**
 * Wrap an async fetch function with stale-while-revalidate caching.
 *
 * @param key      Unique cache key (e.g. `"members/${merchantId}"`)
 * @param fetcher  Async function that fetches fresh data
 * @param onUpdate Optional callback to push background-refresh data into state
 */
export async function cached<T>(
  key: string,
  fetcher: () => Promise<T>,
  onUpdate?: (fresh: T) => void,
): Promise<T> {
  const now = Date.now();
  const ttl = ttlFor(key);
  const entry = store.get(key) as CacheEntry<T> | undefined;

  // ── Cache HIT: fresh ─────────────────────────────────────────────────────
  if (entry && now - entry.ts < ttl) {
    return entry.data;
  }

  // ── Cache HIT: stale — serve old data, refresh in background ─────────────
  if (entry && !entry.fetching) {
    entry.fetching = true;
    fetcher()
      .then(fresh => {
        store.set(key, { data: fresh, ts: Date.now(), fetching: false });
        onUpdate?.(fresh);
      })
      .catch(() => {
        if (entry) entry.fetching = false;
      });
    return entry.data; // return stale immediately — no spinner
  }

  // ── Cache MISS: block until first fetch completes ─────────────────────────
  // (first time this page is visited — unavoidable one-time wait)
  const data = await fetcher();
  store.set(key, { data, ts: Date.now(), fetching: false });
  return data;
}

/** Immediately invalidate one cache entry (call after a mutation). */
export function invalidate(key: string): void {
  store.delete(key);
}

/** Invalidate all entries whose key contains `fragment`. */
export function invalidateContaining(fragment: string): void {
  for (const k of store.keys()) {
    if (k.includes(fragment)) store.delete(k);
  }
}

/** Wipe the entire cache (e.g. on logout). */
export function clearAll(): void {
  store.clear();
}
