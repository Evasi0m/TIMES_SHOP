import { CATALOG_CACHE_TTL_MS } from './config.js';

/** @type {Map<string, { expiresAt: number, value: unknown }>} */
const cache = new Map();

function stableKey(params) {
  const sorted = Object.keys(params || {})
    .sort()
    .reduce((acc, key) => {
      const val = params[key];
      if (val !== undefined && val !== null && val !== '') acc[key] = val;
      return acc;
    }, {});
  return JSON.stringify(sorted);
}

export function getCachedCatalog(key, ttlMs = CATALOG_CACHE_TTL_MS) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

export function setCachedCatalog(key, value, ttlMs = CATALOG_CACHE_TTL_MS) {
  cache.set(key, { expiresAt: Date.now() + ttlMs, value });
}

export function catalogCacheKey(fn, params) {
  return `${fn}:${stableKey(params)}`;
}

export function clearCatalogCache() {
  cache.clear();
}
