import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  catalogCacheKey,
  clearCatalogCache,
  getCachedCatalog,
  setCachedCatalog,
} from './catalog-cache.js';

afterEach(() => {
  clearCatalogCache();
  vi.useRealTimers();
});

describe('catalogCacheKey', () => {
  it('ignores empty values and sorts keys', () => {
    expect(catalogCacheKey('shop-get-catalog', { page: 1, q: '', sort: 'newest' })).toBe(
      catalogCacheKey('shop-get-catalog', { sort: 'newest', page: 1 }),
    );
  });
});

describe('catalog cache TTL', () => {
  it('returns cached value before expiry', () => {
    vi.useFakeTimers();
    const key = 'test';
    setCachedCatalog(key, { ok: true, items: [] }, 1000);
    expect(getCachedCatalog(key, 1000)).toEqual({ ok: true, items: [] });
    vi.advanceTimersByTime(999);
    expect(getCachedCatalog(key, 1000)).toEqual({ ok: true, items: [] });
    vi.advanceTimersByTime(2);
    expect(getCachedCatalog(key, 1000)).toBeNull();
  });
});
