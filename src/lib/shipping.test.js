import { describe, it, expect } from 'vitest';
import {
  DEFAULT_SHIPPING_FEE,
  buildShippingInfo,
  calcGrandTotal,
  formatShippingFeeLabel,
  formatShippingPromoText,
  normalizeShippingFee,
} from './shipping.js';

describe('normalizeShippingFee', () => {
  it('defaults to 29 when value is invalid', () => {
    expect(normalizeShippingFee(undefined)).toBe(DEFAULT_SHIPPING_FEE);
    expect(normalizeShippingFee(-5)).toBe(DEFAULT_SHIPPING_FEE);
  });

  it('accepts zero for free shipping', () => {
    expect(normalizeShippingFee(0, 0)).toBe(0);
  });
});

describe('formatShippingFeeLabel', () => {
  it('shows free shipping label for zero', () => {
    expect(formatShippingFeeLabel(0)).toBe('ส่งฟรี');
  });

  it('formats paid shipping', () => {
    expect(formatShippingFeeLabel(29)).toContain('29');
  });
});

describe('calcGrandTotal', () => {
  it('adds flat shipping to subtotal', () => {
    expect(calcGrandTotal(1000, 29)).toBe(1029);
  });
});

describe('buildShippingInfo', () => {
  it('returns fee and label together', () => {
    expect(buildShippingInfo(29)).toEqual({
      shipping_fee: 29,
      shipping_label: formatShippingFeeLabel(29),
    });
  });
});

describe('formatShippingPromoText', () => {
  it('describes flat shipping per order', () => {
    expect(formatShippingPromoText(29)).toContain('ทุกคำสั่งซื้อ');
  });
});
