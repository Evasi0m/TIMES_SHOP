import { describe, expect, it } from 'vitest';
import { isCasioBrandProduct } from './product-display.js';

describe('isCasioBrandProduct', () => {
  it('returns true for Casio product names', () => {
    expect(isCasioBrandProduct({ product_name: 'Casio G-Shock GA-2100' })).toBe(true);
  });

  it('returns false for non-Casio product names', () => {
    expect(isCasioBrandProduct({ product_name: 'Seiko 5 Sports SRPD' })).toBe(false);
  });
});
