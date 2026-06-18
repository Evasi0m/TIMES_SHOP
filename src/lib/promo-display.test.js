import { describe, expect, it } from 'vitest';
import { PROMO_TYPES } from './promo-types.js';
import {
  formatCouponTicketSubtitle,
  formatPromoDiscount,
  isRedundantPromoName,
} from './promo-display.js';

describe('coupon ticket copy', () => {
  it('drops redundant display_name for free shipping', () => {
    const promo = {
      display_name: 'ส่งฟรี',
      promo_type: PROMO_TYPES.FREE_SHIPPING,
      min_order: 0,
    };
    expect(formatPromoDiscount(promo)).toBe('ส่งฟรี');
    expect(isRedundantPromoName(promo)).toBe(true);
    expect(formatCouponTicketSubtitle(promo)).toBeNull();
  });

  it('shows min order only when name repeats headline', () => {
    const promo = {
      display_name: 'ส่งฟรี',
      promo_type: PROMO_TYPES.FREE_SHIPPING,
      min_order: 500,
    };
    expect(formatCouponTicketSubtitle(promo)).toBe('ขั้นต่ำ 500');
  });

  it('shows distinct name with min order', () => {
    const promo = {
      display_name: 'ลดเปิดร้าน',
      promo_type: PROMO_TYPES.PRODUCT_DISCOUNT,
      discount_mode: 'percent',
      discount_value: 10,
      min_order: 1000,
    };
    expect(formatCouponTicketSubtitle(promo)).toBe('ขั้นต่ำ 1,000 · ลดเปิดร้าน');
  });
});
