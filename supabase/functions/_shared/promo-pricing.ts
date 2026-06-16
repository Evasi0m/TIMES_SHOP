import type { PromoRow } from './promo.ts';
import { isPromoActive } from './promo.ts';

export const PROMO_TYPES = {
  PRODUCT_DISCOUNT: 'product_discount',
  FREE_SHIPPING: 'free_shipping',
  COD_DISCOUNT: 'cod_discount',
  SPECIAL_DISCOUNT: 'special_discount',
} as const;

export const DISCOUNT_MODES = {
  PERCENT: 'percent',
  AMOUNT: 'amount',
} as const;

export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

function calcDiscountAmount(base: number, promo: PromoRow): number {
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

export function pickBestPromoPerType(promos: PromoRow[], subtotal: number): Record<string, PromoRow> {
  const byType: Record<string, PromoRow> = {};
  for (const promo of promos || []) {
    const type = promo.promo_type;
    if (!type) continue;
    if (type === PROMO_TYPES.FREE_SHIPPING) {
      if (!byType[type]) byType[type] = promo;
      continue;
    }
    const amount = calcDiscountAmount(subtotal, promo);
    const current = byType[type];
    const currentAmount = current ? calcDiscountAmount(subtotal, current) : -1;
    if (!current || amount > currentAmount) byType[type] = promo;
  }
  return byType;
}

export function filterActivePromos(promos: PromoRow[], now = Date.now()): PromoRow[] {
  return (promos || []).filter((p) => isPromoActive(p, now));
}

export type PromoBreakdownLine = {
  id: string;
  display_name: string;
  promo_type: string;
  amount: number;
};

export type PromoTotals = {
  subtotal: number;
  discountedSubtotal: number;
  productDiscount: number;
  specialDiscount: number;
  shippingFee: number;
  shippingBase: number;
  codDiscount: number;
  discount: number;
  grandTotal: number;
  breakdown: PromoBreakdownLine[];
  appliedPromoIds: string[];
  bestByType: Record<string, PromoRow>;
  hasFreeShipping: boolean;
};

export function calcPromoTotals(
  subtotal: number,
  baseShippingFee: number,
  promos: PromoRow[],
  options: { paymentMethod?: string } = {},
): PromoTotals {
  const base = roundMoney(subtotal);
  const shippingBase = roundMoney(baseShippingFee);
  const active = filterActivePromos(promos);
  const best = pickBestPromoPerType(active, base);

  const breakdown: PromoBreakdownLine[] = [];
  let running = base;

  const productPromo = best[PROMO_TYPES.PRODUCT_DISCOUNT];
  const productDiscount = calcDiscountAmount(running, productPromo);
  if (productPromo && productDiscount > 0) {
    breakdown.push({
      id: productPromo.id,
      display_name: productPromo.display_name,
      promo_type: PROMO_TYPES.PRODUCT_DISCOUNT,
      amount: productDiscount,
    });
    running = roundMoney(running - productDiscount);
  }

  const specialPromo = best[PROMO_TYPES.SPECIAL_DISCOUNT];
  const specialDiscount = calcDiscountAmount(running, specialPromo);
  if (specialPromo && specialDiscount > 0) {
    breakdown.push({
      id: specialPromo.id,
      display_name: specialPromo.display_name,
      promo_type: PROMO_TYPES.SPECIAL_DISCOUNT,
      amount: specialDiscount,
    });
    running = roundMoney(running - specialDiscount);
  }

  const discountedSubtotal = running;
  const freeShipPromo = best[PROMO_TYPES.FREE_SHIPPING];
  const shippingFee = freeShipPromo ? 0 : shippingBase;
  if (freeShipPromo && shippingBase > 0) {
    breakdown.push({
      id: freeShipPromo.id,
      display_name: freeShipPromo.display_name,
      promo_type: PROMO_TYPES.FREE_SHIPPING,
      amount: shippingBase,
    });
  }

  let grandTotal = roundMoney(discountedSubtotal + shippingFee);

  const codPromo = best[PROMO_TYPES.COD_DISCOUNT];
  let codDiscount = 0;
  if (options.paymentMethod === 'cod' && codPromo) {
    codDiscount = calcDiscountAmount(grandTotal, codPromo);
    if (codDiscount > 0) {
      breakdown.push({
        id: codPromo.id,
        display_name: codPromo.display_name,
        promo_type: PROMO_TYPES.COD_DISCOUNT,
        amount: codDiscount,
      });
      grandTotal = roundMoney(grandTotal - codDiscount);
    }
  }

  const appliedPromoIds = breakdown.map((b) => b.id).filter(Boolean);
  const totalDiscount = roundMoney(
    productDiscount + specialDiscount + (freeShipPromo ? shippingBase : 0) + codDiscount,
  );

  return {
    subtotal: base,
    discountedSubtotal,
    productDiscount,
    specialDiscount,
    shippingFee,
    shippingBase,
    codDiscount,
    discount: totalDiscount,
    grandTotal,
    breakdown,
    appliedPromoIds,
    bestByType: best,
    hasFreeShipping: Boolean(freeShipPromo),
  };
}
