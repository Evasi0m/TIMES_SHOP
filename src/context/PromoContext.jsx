import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import { shopApi } from '../lib/shop-api.js';
import { calcDisplayUnitPrice, calcPromoTotals, hasActivePromoType } from '../lib/promo-pricing.js';
import { PROMO_TYPES } from '../lib/promo-types.js';

const PromoContext = createContext(null);

export function PromoProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);

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
    const getDisplayPrice = (unitPrice) => calcDisplayUnitPrice(unitPrice, promos);
    const getOrderTotals = (subtotal, shippingFee, paymentMethod) =>
      calcPromoTotals(subtotal, shippingFee, promos, { paymentMethod });

    return {
      promos,
      loading,
      refresh,
      hasProductDiscount: hasActivePromoType(
        promos,
        PROMO_TYPES.PRODUCT_DISCOUNT,
        PROMO_TYPES.SPECIAL_DISCOUNT
      ),
      hasFreeShippingPromo: hasActivePromoType(promos, PROMO_TYPES.FREE_SHIPPING),
      getDisplayPrice,
      getOrderTotals,
    };
  }, [promos, loading, refresh]);

  return <PromoContext.Provider value={value}>{children}</PromoContext.Provider>;
}

export function usePromo() {
  const ctx = useContext(PromoContext);
  if (!ctx) throw new Error('usePromo must be used within PromoProvider');
  return ctx;
}

export function useDisplayPrice(unitPrice) {
  const { getDisplayPrice, hasProductDiscount } = usePromo();
  const base = Number(unitPrice) || 0;
  const display = getDisplayPrice(base);
  return {
    basePrice: base,
    displayPrice: display,
    hasDiscount: hasProductDiscount && display < base,
  };
}

export function useOrderTotals(subtotal, shippingFee, paymentMethod = '') {
  const { getOrderTotals } = usePromo();
  return useMemo(
    () => getOrderTotals(subtotal, shippingFee, paymentMethod),
    [getOrderTotals, subtotal, shippingFee, paymentMethod]
  );
}
