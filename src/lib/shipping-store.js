import { buildShippingInfo, DEFAULT_SHIPPING_FEE, normalizeShippingFee } from './shipping.js';

export const CLIENT_SHIPPING_KEY = 'times_shop_shipping_fee';

export function hasClientShippingOverride() {
  try {
    return localStorage.getItem(CLIENT_SHIPPING_KEY) !== null;
  } catch {
    return false;
  }
}

export function readClientShippingFee(fallback = DEFAULT_SHIPPING_FEE) {
  try {
    const raw = localStorage.getItem(CLIENT_SHIPPING_KEY);
    if (raw === null) return fallback;
    return normalizeShippingFee(Number(raw), fallback);
  } catch {
    return fallback;
  }
}

export function writeClientShippingFee(fee) {
  localStorage.setItem(
    CLIENT_SHIPPING_KEY,
    String(normalizeShippingFee(fee, DEFAULT_SHIPPING_FEE)),
  );
}

export function getClientShippingInfo() {
  return buildShippingInfo(readClientShippingFee());
}

export function mergeClientShippingIntoResponse(res) {
  if (!res?.ok || !hasClientShippingOverride()) return res;
  const info = getClientShippingInfo();
  return {
    ...res,
    shipping_fee: info.shipping_fee,
    shipping_label: info.shipping_label,
  };
}
