import { describe, expect, it } from 'vitest';
import { computeInStockPriceMin, getListingCardDisplayPrice } from './listing-display.js';

describe('listing card pricing', () => {
  it('computeInStockPriceMin ignores out-of-stock SKUs', () => {
    const skus = [
      { unit_price: 5000, stock_available: 5, in_stock: true },
      { unit_price: 1000, stock_available: 0, in_stock: false },
      { unit_price: 6000, stock_available: 2, in_stock: true },
    ];
    expect(computeInStockPriceMin(skus)).toBe(5000);
  });

  it('getListingCardDisplayPrice prefers price_min_in_stock', () => {
    expect(getListingCardDisplayPrice({ price_min: 1000, price_min_in_stock: 5000 })).toBe(5000);
  });
});
