import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import { useCart } from './CartContext.jsx';
import { shopApi } from '../lib/shop-api.js';
import { resolvePdpPrice } from '../lib/pricing-policy.js';
import { calcDisplayUnitPrice, calcPromoTotals, hasActivePromoType } from '../lib/promo-pricing.js';
import { PROMO_TYPES } from '../lib/promo-types.js';

const PromoContext = createContext(null);

export function PromoProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState('');

  const refresh = useCallback(async () => {
    const res = await shopApi.getActivePromos({ user_id: userId });
    if (res.ok) setPromos(res.promos || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    setLoading(true);
    refresh();
  }, [refresh]);

  const value = useMemo(() => {
    const getDisplayPrice = (unitPrice, cartSubtotal) =>
      calcDisplayUnitPrice(unitPrice, promos, {
        cartSubtotal: cartSubtotal ?? undefined,
      });
    const getOrderTotals = (subtotal, shippingFee, paymentMethod) =>
      calcPromoTotals(subtotal, shippingFee, promos, { paymentMethod });

    return {
      promos,
      loading,
      refresh,
      couponCode,
      setCouponCode,
      hasProductDiscount: hasActivePromoType(
        promos,
        PROMO_TYPES.PRODUCT_DISCOUNT,
        PROMO_TYPES.SPECIAL_DISCOUNT
      ),
      hasFreeShippingPromo: hasActivePromoType(promos, PROMO_TYPES.FREE_SHIPPING),
      hasCodDiscountPromo: hasActivePromoType(promos, PROMO_TYPES.COD_DISCOUNT),
      hasSpecialDiscountPromo: hasActivePromoType(promos, PROMO_TYPES.SPECIAL_DISCOUNT),
      getDisplayPrice,
      getOrderTotals,
      resolvePdpPrice: (unitPrice) => resolvePdpPrice(unitPrice, promos),
    };
  }, [promos, loading, refresh, couponCode]);

  return <PromoContext.Provider value={value}>{children}</PromoContext.Provider>;
}

export function usePromo() {
  const ctx = useContext(PromoContext);
  if (!ctx) throw new Error('usePromo must be used within PromoProvider');
  return ctx;
}

export function useDisplayPrice(unitPrice, { useCartSubtotal = false } = {}) {
  const { getDisplayPrice, hasProductDiscount, resolvePdpPrice: resolvePrice } = usePromo();
  const { subtotal } = useCart();
  const base = Number(unitPrice) || 0;
  if (!useCartSubtotal) {
    const pdp = resolvePrice(base);
    return {
      basePrice: pdp.basePrice,
      displayPrice: pdp.displayPrice,
      hasDiscount: pdp.hasDiscount,
      minOrderHint: pdp.minOrderHint,
    };
  }
  const cartSubtotal = useCartSubtotal ? subtotal : undefined;
  const display = getDisplayPrice(base, cartSubtotal);
  return {
    basePrice: base,
    displayPrice: display,
    hasDiscount: hasProductDiscount && display < base,
    minOrderHint: null,
  };
}

export function useOrderTotals(subtotal, shippingFee, paymentMethod = '') {
  const { getOrderTotals } = usePromo();
  return useMemo(
    () => getOrderTotals(subtotal, shippingFee, paymentMethod),
    [getOrderTotals, subtotal, shippingFee, paymentMethod]
  );
}
