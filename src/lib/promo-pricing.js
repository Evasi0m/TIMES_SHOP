import { roundMoney } from './money.js';
import { DISCOUNT_MODES, PROMO_TYPE_LIST, PROMO_TYPES } from './promo-types.js';

function calcDiscountAmount(base, promo) {
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

/** Pick the promo that yields the highest discount for each type. */
export function pickBestPromoPerType(promos, subtotal) {
  const byType = {};
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

export function isPromoActive(promo, now = new Date()) {
  if (!promo?.is_active) return false;
  if (promo.distribution === 'draft') return false;
  const t = now.getTime();
  if (promo.starts_at && new Date(promo.starts_at).getTime() > t) return false;
  if (promo.expires_at && new Date(promo.expires_at).getTime() < t) return false;
  if (promo.max_uses != null && Number(promo.used_count) >= Number(promo.max_uses)) return false;
  return true;
}

export function filterActivePromos(promos, now = new Date()) {
  return (promos || []).filter((p) => isPromoActive(p, now));
}

/**
 * @param {number} subtotal
 * @param {number} baseShippingFee
 * @param {object[]} promos - active promos applicable to this user/session
 * @param {{ paymentMethod?: string }} options
 */
export function calcPromoTotals(subtotal, baseShippingFee, promos, options = {}) {
  const base = roundMoney(subtotal);
  const shippingBase = roundMoney(baseShippingFee);
  const active = filterActivePromos(promos);
  const best = pickBestPromoPerType(active, base);

  const breakdown = [];
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
    productDiscount + specialDiscount + (freeShipPromo ? shippingBase : 0) + codDiscount
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

/**
 * Display price for a single unit after product + special promos (excludes shipping/COD).
 * @param {number} unitPrice
 * @param {object[]} promos
 * @param {{ cartSubtotal?: number }} [options] — when set, min_order is checked against cart subtotal
 */
export function calcDisplayUnitPrice(unitPrice, promos, options = {}) {
  const base = roundMoney(unitPrice);
  if (options.cartSubtotal != null) {
    const cartSubtotal = roundMoney(options.cartSubtotal);
    const totals = calcPromoTotals(cartSubtotal, 0, promos);
    if (totals.discount <= 0 || cartSubtotal <= 0) return base;
    const ratio = base / cartSubtotal;
    return roundMoney(totals.discountedSubtotal * ratio);
  }
  const { discountedSubtotal } = calcPromoTotals(base, 0, promos);
  return discountedSubtotal;
}

export function hasActivePromoType(promos, ...types) {
  return filterActivePromos(promos).some((p) => types.includes(p.promo_type));
}

export function hasProductLevelDiscount(promos) {
  return hasActivePromoType(
    promos,
    PROMO_TYPES.PRODUCT_DISCOUNT,
    PROMO_TYPES.SPECIAL_DISCOUNT
  );
}

export function getActivePromoLabels(promos) {
  const active = filterActivePromos(promos);
  const best = pickBestPromoPerType(active, 1000);
  return PROMO_TYPE_LIST.map((type) => best[type]?.display_name).filter(Boolean);
}
