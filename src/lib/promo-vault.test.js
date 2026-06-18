import { describe, expect, it } from 'vitest';
import { PROMO_TYPES } from './promo-types.js';
import {
  buildVaultStats,
  filterPromos,
  sortPromos,
  VAULT_SORT_NAME,
  VAULT_SORT_NEWEST,
} from './promo-vault.js';

const sample = [
  {
    id: '1',
    display_name: 'ส่งฟรี',
    promo_type: PROMO_TYPES.FREE_SHIPPING,
    status: 'active',
    public_code: 'FREE',
    updated_at: '2026-06-01T00:00:00Z',
  },
  {
    id: '2',
    display_name: 'ลด 10%',
    promo_type: PROMO_TYPES.PRODUCT_DISCOUNT,
    status: 'draft',
    internal_code: 'PROMO-ABC',
    updated_at: '2026-06-10T00:00:00Z',
  },
  {
    id: '3',
    display_name: 'โปรเก่า',
    promo_type: PROMO_TYPES.PRODUCT_DISCOUNT,
    status: 'inactive',
    updated_at: '2026-05-01T00:00:00Z',
  },
];

describe('filterPromos', () => {
  it('filters by type', () => {
    expect(filterPromos(sample, { type: PROMO_TYPES.FREE_SHIPPING })).toHaveLength(1);
  });

  it('filters by pending bucket', () => {
    expect(filterPromos(sample, { status: 'pending' })).toHaveLength(1);
  });

  it('filters by closed bucket', () => {
    expect(filterPromos(sample, { status: 'closed' })).toHaveLength(1);
  });

  it('searches name and code', () => {
    expect(filterPromos(sample, { query: 'free' })).toHaveLength(1);
    expect(filterPromos(sample, { query: 'PROMO-ABC' })).toHaveLength(1);
  });
});

describe('buildVaultStats', () => {
  it('counts totals', () => {
    expect(buildVaultStats(sample)).toEqual({
      total: 3,
      active: 1,
      pending: 1,
      closed: 1,
    });
  });
});

describe('sortPromos', () => {
  it('sorts by newest', () => {
    const sorted = sortPromos(sample, VAULT_SORT_NEWEST);
    expect(sorted[0].id).toBe('2');
  });

  it('sorts by name', () => {
    const sorted = sortPromos(sample, VAULT_SORT_NAME);
    const expected = [...sample]
      .sort((a, b) => String(a.display_name).localeCompare(String(b.display_name), 'th'))
      .map((p) => p.id);
    expect(sorted.map((p) => p.id)).toEqual(expected);
  });
});
