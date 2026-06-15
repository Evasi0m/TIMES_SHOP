import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { shopApi } from '../lib/shop-api.js';
import {
  DEFAULT_SHIPPING_FEE,
  buildShippingInfo,
  calcGrandTotal,
  formatShippingPromoText,
  formatShippingShortText,
} from '../lib/shipping.js';

const ShippingContext = createContext(null);

export function ShippingProvider({ children }) {
  const [shippingFee, setShippingFee] = useState(DEFAULT_SHIPPING_FEE);
  const [shippingLabel, setShippingLabel] = useState(buildShippingInfo(DEFAULT_SHIPPING_FEE).shipping_label);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const res = await shopApi.getPaymentInfo();
    if (res.ok) {
      const info = buildShippingInfo(res.shipping_fee ?? DEFAULT_SHIPPING_FEE);
      setShippingFee(info.shipping_fee);
      setShippingLabel(res.shipping_label || info.shipping_label);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      shippingFee,
      shippingLabel,
      shippingPromoText: formatShippingPromoText(shippingFee),
      shippingShortText: formatShippingShortText(shippingFee),
      loading,
      refresh,
      grandTotal: (subtotal) => calcGrandTotal(subtotal, shippingFee),
    }),
    [shippingFee, shippingLabel, loading, refresh]
  );

  return <ShippingContext.Provider value={value}>{children}</ShippingContext.Provider>;
}

export function useShipping() {
  const ctx = useContext(ShippingContext);
  if (!ctx) throw new Error('useShipping must be used within ShippingProvider');
  return ctx;
}
