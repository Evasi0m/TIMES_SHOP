import { describe, expect, it } from 'vitest';
import { isNewProduct, NEW_PRODUCT_DAYS } from './is-new-product.js';

describe('isNewProduct', () => {
  const now = Date.parse('2026-06-15T12:00:00.000Z');

  it('returns true within NEW_PRODUCT_DAYS window', () => {
    const created = new Date(now - (NEW_PRODUCT_DAYS - 1) * 24 * 60 * 60 * 1000).toISOString();
    expect(isNewProduct({ created_at: created }, now)).toBe(true);
  });

  it('returns false when older than window', () => {
    const created = new Date(now - (NEW_PRODUCT_DAYS + 1) * 24 * 60 * 60 * 1000).toISOString();
    expect(isNewProduct({ created_at: created }, now)).toBe(false);
  });

  it('returns false when created_at missing or invalid', () => {
    expect(isNewProduct({}, now)).toBe(false);
    expect(isNewProduct({ created_at: null }, now)).toBe(false);
    expect(isNewProduct({ created_at: 'not-a-date' }, now)).toBe(false);
  });
});
