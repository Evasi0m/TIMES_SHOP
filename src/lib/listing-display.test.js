import { describe, expect, it } from 'vitest';
import {
  computeInStockPriceMin,
  getListingCardDisplayPrice,
  normalizeListingItem,
} from './listing-display.js';

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

describe('normalizeListingItem', () => {
  it('prefers listing_image_url over SKU image_url', () => {
    const item = {
      tiktok_product_id: 'p1',
      sku_count: 3,
      listing_image_url: 'https://example.com/cover.jpg',
      image_url: 'https://example.com/sku.jpg',
    };
    const normalized = normalizeListingItem(item);
    expect(normalized.image_url).toBe('https://example.com/cover.jpg');
    expect(normalized.listing_image_url).toBe('https://example.com/cover.jpg');
  });

  it('returns SKU items unchanged', () => {
    const item = { tiktok_sku_id: 's1', image_url: 'https://example.com/sku.jpg' };
    expect(normalizeListingItem(item)).toEqual(item);
  });
});
