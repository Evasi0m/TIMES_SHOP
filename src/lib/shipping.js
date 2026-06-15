import { fmtTHB, roundMoney } from './money.js';

/** Flat shipping fee per order when admin has not configured a value yet. */
export const DEFAULT_SHIPPING_FEE = 29;

export function normalizeShippingFee(value, fallback = DEFAULT_SHIPPING_FEE) {
  if (value == null || value === '') return fallback;
  const n = roundMoney(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return n;
}

export function formatShippingFeeLabel(fee) {
  const amount = normalizeShippingFee(fee, 0);
  if (amount <= 0) return 'ส่งฟรี';
  return fmtTHB(amount);
}

export function formatShippingPromoText(fee) {
  const amount = normalizeShippingFee(fee, 0);
  if (amount <= 0) return 'ส่งฟรีทั่วประเทศ';
  return `ค่าจัดส่ง ${fmtTHB(amount)} ทุกคำสั่งซื้อ`;
}

export function formatShippingShortText(fee) {
  const amount = normalizeShippingFee(fee, 0);
  if (amount <= 0) return 'ส่งฟรี';
  return `ค่าส่ง ${fmtTHB(amount)}`;
}

export function calcGrandTotal(subtotal, shippingFee) {
  return roundMoney(subtotal + normalizeShippingFee(shippingFee, 0));
}

export function buildShippingInfo(fee) {
  const shipping_fee = normalizeShippingFee(fee);
  return {
    shipping_fee,
    shipping_label: formatShippingFeeLabel(shipping_fee),
  };
}
