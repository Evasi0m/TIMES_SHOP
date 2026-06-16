import { describe, it, expect } from 'vitest';
import { PROMO_TYPES } from './promo-types.js';
import {
  calcDisplayUnitPrice,
  calcPromoTotals,
  filterActivePromos,
  hasActivePromoType,
  isPromoActive,
  pickBestPromoPerType,
} from './promo-pricing.js';

const basePromo = (overrides = {}) => ({
  id: 'p1',
  display_name: 'Test',
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

describe('isPromoActive', () => {
  it('rejects draft and expired promos', () => {
    expect(isPromoActive(basePromo({ distribution: 'draft' }))).toBe(false);
    expect(
      isPromoActive(
        basePromo({ expires_at: '2020-01-01T00:00:00Z' }),
        new Date('2026-01-01')
      )
    ).toBe(false);
  });

  it('accepts active broadcast without expiry', () => {
    expect(isPromoActive(basePromo())).toBe(true);
  });
});

describe('pickBestPromoPerType', () => {
  it('picks highest product discount', () => {
    const promos = [
      basePromo({ id: 'a', discount_value: 5 }),
      basePromo({ id: 'b', discount_value: 15 }),
    ];
    const best = pickBestPromoPerType(promos, 1000);
    expect(best[PROMO_TYPES.PRODUCT_DISCOUNT].id).toBe('b');
  });
});

describe('calcPromoTotals', () => {
  it('stacks all four promo types', () => {
    const promos = [
      basePromo({
        id: 'prod',
        display_name: 'ลดสินค้า 10%',
        discount_value: 10,
      }),
      basePromo({
        id: 'special',
        promo_type: PROMO_TYPES.SPECIAL_DISCOUNT,
        display_name: 'พิเศษ 50',
        discount_mode: 'amount',
        discount_value: 50,
      }),
      basePromo({
        id: 'ship',
        promo_type: PROMO_TYPES.FREE_SHIPPING,
        display_name: 'ส่งฟรี',
        discount_mode: null,
        discount_value: 0,
      }),
      basePromo({
        id: 'cod',
        promo_type: PROMO_TYPES.COD_DISCOUNT,
        display_name: 'ลด COD 20',
        discount_mode: 'amount',
        discount_value: 20,
      }),
    ];

    const withoutCod = calcPromoTotals(1000, 29, promos);
    expect(withoutCod.productDiscount).toBe(100);
    expect(withoutCod.specialDiscount).toBe(50);
    expect(withoutCod.shippingFee).toBe(0);
    expect(withoutCod.grandTotal).toBe(850);

    const withCod = calcPromoTotals(1000, 29, promos, { paymentMethod: 'cod' });
    expect(withCod.codDiscount).toBe(20);
    expect(withCod.grandTotal).toBe(830);
    expect(withCod.appliedPromoIds).toHaveLength(4);
  });

  it('ignores cod discount when payment is transfer', () => {
    const promos = [
      basePromo({
        id: 'cod',
        promo_type: PROMO_TYPES.COD_DISCOUNT,
        discount_mode: 'amount',
        discount_value: 20,
      }),
    ];
    const totals = calcPromoTotals(500, 29, promos, { paymentMethod: 'transfer' });
    expect(totals.codDiscount).toBe(0);
    expect(totals.grandTotal).toBe(529);
  });
});

describe('calcDisplayUnitPrice', () => {
  it('applies product-level discounts to unit price', () => {
    const promos = [basePromo({ discount_value: 10 })];
    expect(calcDisplayUnitPrice(1000, promos)).toBe(900);
  });
});

describe('filterActivePromos', () => {
  it('filters inactive promos', () => {
    const promos = [basePromo(), basePromo({ id: 'x', is_active: false })];
    expect(filterActivePromos(promos)).toHaveLength(1);
  });
});

describe('hasActivePromoType', () => {
  it('returns false for draft promos', () => {
    const promos = [
      basePromo({
        promo_type: PROMO_TYPES.FREE_SHIPPING,
        discount_mode: null,
        discount_value: 0,
        distribution: 'draft',
      }),
    ];
    expect(hasActivePromoType(promos, PROMO_TYPES.FREE_SHIPPING)).toBe(false);
  });

  it('returns true for active broadcast free shipping', () => {
    const promos = [
      basePromo({
        promo_type: PROMO_TYPES.FREE_SHIPPING,
        discount_mode: null,
        discount_value: 0,
      }),
    ];
    expect(hasActivePromoType(promos, PROMO_TYPES.FREE_SHIPPING)).toBe(true);
  });

  it('returns true for product or special discount types', () => {
    const product = [basePromo({ promo_type: PROMO_TYPES.PRODUCT_DISCOUNT })];
    const special = [
      basePromo({
        id: 's1',
        promo_type: PROMO_TYPES.SPECIAL_DISCOUNT,
        discount_mode: 'amount',
        discount_value: 50,
      }),
    ];
    expect(
      hasActivePromoType(product, PROMO_TYPES.PRODUCT_DISCOUNT, PROMO_TYPES.SPECIAL_DISCOUNT)
    ).toBe(true);
    expect(
      hasActivePromoType(special, PROMO_TYPES.PRODUCT_DISCOUNT, PROMO_TYPES.SPECIAL_DISCOUNT)
    ).toBe(true);
  });

  it('returns false for expired promos', () => {
    const promos = [
      basePromo({
        promo_type: PROMO_TYPES.FREE_SHIPPING,
        discount_mode: null,
        discount_value: 0,
        expires_at: '2020-01-01T00:00:00Z',
      }),
    ];
    expect(hasActivePromoType(promos, PROMO_TYPES.FREE_SHIPPING)).toBe(false);
  });
});
