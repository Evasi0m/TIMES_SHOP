import { fmtTHB, roundMoney } from './money.js';
import { formatPromoDiscount } from './promo-display.js';
import {
  calcPromoTotals,
  filterActivePromos,
} from './promo-pricing.js';
import { DISCOUNT_MODES, PROMO_TYPES } from './promo-types.js';

/** Shown on cart / mini-cart — client totals are estimates only. */
export const PRICE_DISCLAIMER = 'ยอดสุทธิยืนยันที่หน้าชำระเงิน';

const PRODUCT_LEVEL_TYPES = [PROMO_TYPES.PRODUCT_DISCOUNT, PROMO_TYPES.SPECIAL_DISCOUNT];

function calcProductDiscountAtBase(base, promo) {
  if (!promo || base <= 0) return 0;
  const minOrder = Number(promo.min_order) || 0;
  if (base < minOrder) return 0;
  if (promo.promo_type === PROMO_TYPES.FREE_SHIPPING) return 0;
  const value = Number(promo.discount_value) || 0;
  if (promo.discount_mode === DISCOUNT_MODES.PERCENT) {
    return roundMoney((base * value) / 100);
  }
  if (promo.discount_mode === DISCOUNT_MODES.AMOUNT) {
    return roundMoney(Math.min(value, base));
  }
  return 0;
}

/** Best product/special promo whose min_order is not yet met at compareAmount. */
export function findUnmetMinOrderPromo(promos, compareAmount) {
  const active = filterActivePromos(promos);
  let best = null;
  let bestAtMin = -1;
  for (const promo of active) {
    if (!PRODUCT_LEVEL_TYPES.includes(promo.promo_type)) continue;
    const minOrder = Number(promo.min_order) || 0;
    if (minOrder <= compareAmount) continue;
    const atMin = calcProductDiscountAtBase(minOrder, promo);
    if (atMin > bestAtMin) {
      bestAtMin = atMin;
      best = promo;
    }
  }
  return best;
}

/** PDP hint: "ซื้อครบ ฿X ลด Y" */
export function formatMinOrderHint(promo) {
  if (!promo) return null;
  const minOrder = Number(promo.min_order) || 0;
  if (minOrder <= 0) return null;
  const discount = formatPromoDiscount(promo);
  return `ซื้อครบ ${fmtTHB(minOrder)} ${discount}`;
}

/**
 * PDP / product card display — estimate only; no discounted price when min_order unmet.
 */
export function resolvePdpPrice(unitPrice, promos) {
  const base = roundMoney(unitPrice);
  const totals = calcPromoTotals(base, 0, promos);
  const hasDiscount = totals.discountedSubtotal < base;
  const minOrderHint = hasDiscount
    ? null
    : formatMinOrderHint(findUnmetMinOrderPromo(promos, base));

  return {
    basePrice: base,
    displayPrice: hasDiscount ? totals.discountedSubtotal : base,
    hasDiscount,
    minOrderHint,
  };
}

/** Total savings row for order summary. */
export function calcTotalSavings(orderTotals) {
  return roundMoney(Number(orderTotals?.discount) || 0);
}

/**
 * Promos eligible but not applied (e.g. min_order not met) — for checkout messaging.
 */
export function getUnappliedPromoHints(promos, subtotal, breakdown = []) {
  const appliedIds = new Set((breakdown || []).map((b) => b.id));
  const active = filterActivePromos(promos);
  const hints = [];

  for (const promo of active) {
    if (appliedIds.has(promo.id)) continue;
    const minOrder = Number(promo.min_order) || 0;
    if (minOrder > subtotal && PRODUCT_LEVEL_TYPES.includes(promo.promo_type)) {
      hints.push({
        id: promo.id,
        display_name: promo.display_name,
        message: `${promo.display_name} — ใช้ได้เมื่อยอดถึง ${fmtTHB(minOrder)}`,
      });
    }
  }
  return hints;
}

/** Whether COD payment changes the quoted total. */
export function hasCodDiscount(promos) {
  return filterActivePromos(promos).some((p) => p.promo_type === PROMO_TYPES.COD_DISCOUNT);
}
