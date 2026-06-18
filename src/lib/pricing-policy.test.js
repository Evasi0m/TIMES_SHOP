import { describe, it, expect } from 'vitest';
import { PROMO_TYPES } from './promo-types.js';
import {
  PRICE_DISCLAIMER,
  calcTotalSavings,
  findUnmetMinOrderPromo,
  formatMinOrderHint,
  getUnappliedPromoHints,
  resolvePdpPrice,
} from './pricing-policy.js';
import { calcDisplayUnitPrice } from './promo-pricing.js';

const basePromo = (overrides = {}) => ({
  id: 'p1',
  display_name: 'ลดสินค้า',
  promo_type: PROMO_TYPES.PRODUCT_DISCOUNT,
  discount_mode: 'percent',
  discount_value: 10,
  min_order: 0,
  is_active: true,
  distribution: 'broadcast',
  starts_at: null,
  expires_at: null,
  max_uses: null,
  used_count: 0,
  ...overrides,
});

describe('PRICE_DISCLAIMER', () => {
  it('is Thai checkout disclaimer text', () => {
    expect(PRICE_DISCLAIMER).toContain('ยอดสุทธิ');
  });
});

describe('resolvePdpPrice', () => {
  it('shows discount when min_order met at unit price', () => {
    const promos = [basePromo({ discount_value: 10 })];
    const result = resolvePdpPrice(1000, promos);
    expect(result.hasDiscount).toBe(true);
    expect(result.displayPrice).toBe(900);
    expect(result.minOrderHint).toBeNull();
  });

  it('shows min_order hint instead of discounted price when unmet', () => {
    const promos = [basePromo({ min_order: 1000, discount_value: 10 })];
    const result = resolvePdpPrice(500, promos);
    expect(result.hasDiscount).toBe(false);
    expect(result.displayPrice).toBe(500);
    expect(result.minOrderHint).toContain('ซื้อครบ');
    expect(result.minOrderHint).toContain('ลด 10%');
  });
});

describe('formatMinOrderHint', () => {
  it('formats Thai min order message', () => {
    const hint = formatMinOrderHint(basePromo({ min_order: 1500, discount_value: 50, discount_mode: 'amount' }));
    expect(hint).toMatch(/ซื้อครบ.*1,500.*ลด/);
  });
});

describe('calcDisplayUnitPrice with cartSubtotal', () => {
  it('applies discount when cart subtotal meets min_order', () => {
    const promos = [basePromo({ min_order: 1000, discount_value: 10 })];
    expect(calcDisplayUnitPrice(500, promos)).toBe(500);
    expect(calcDisplayUnitPrice(500, promos, { cartSubtotal: 1000 })).toBe(450);
  });
});

describe('getUnappliedPromoHints', () => {
  it('lists promos not applied due to min_order', () => {
    const promos = [basePromo({ id: 'x', min_order: 2000, display_name: 'ลดใหญ่' })];
    const hints = getUnappliedPromoHints(promos, 1000, []);
    expect(hints).toHaveLength(1);
    expect(hints[0].message).toContain('2,000');
  });
});

describe('calcTotalSavings', () => {
  it('returns discount from order totals', () => {
    expect(calcTotalSavings({ discount: 129 })).toBe(129);
  });
});

describe('findUnmetMinOrderPromo', () => {
  it('picks best promo among unmet min orders', () => {
    const promos = [
      basePromo({ id: 'a', min_order: 2000, discount_value: 5 }),
      basePromo({ id: 'b', min_order: 1500, discount_value: 15 }),
    ];
    expect(findUnmetMinOrderPromo(promos, 500)?.id).toBe('b');
  });
});
