import { buildShippingInfo, DEFAULT_SHIPPING_FEE, normalizeShippingFee } from './shipping.js';

export const CLIENT_SHIPPING_KEY = 'times_shop_shipping_fee';
export const CLIENT_PROFILE_IMAGE_KEY = 'times_shop_profile_image_url';
export const CLIENT_COVER_IMAGE_KEY = 'times_shop_cover_image_url';

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
  if (!res?.ok) return res;
  let next = { ...res };
  if (hasClientShippingOverride()) {
    const info = getClientShippingInfo();
    next = {
      ...next,
      shipping_fee: info.shipping_fee,
      shipping_label: info.shipping_label,
    };
  }
  if (hasClientProfileImageOverride()) {
    next = {
      ...next,
      store: {
        ...(next.store ?? {}),
        profile_image_url: readClientProfileImageUrl(),
        name: next.store?.name ?? 'TIMES STORE',
      },
    };
  }
  if (hasClientCoverImageOverride()) {
    next = {
      ...next,
      store: {
        ...(next.store ?? {}),
        cover_image_url: readClientCoverImageUrl(),
        name: next.store?.name ?? 'TIMES STORE',
      },
    };
  }
  return next;
}

export function hasClientProfileImageOverride() {
  try {
    return localStorage.getItem(CLIENT_PROFILE_IMAGE_KEY) !== null;
  } catch {
    return false;
  }
}

export function readClientProfileImageUrl() {
  try {
    const raw = localStorage.getItem(CLIENT_PROFILE_IMAGE_KEY);
    if (raw === null || raw === '') return null;
    return String(raw).trim() || null;
  } catch {
    return null;
  }
}

export function writeClientProfileImageUrl(url) {
  const trimmed = url == null || url === '' ? '' : String(url).trim();
  if (!trimmed) {
    localStorage.removeItem(CLIENT_PROFILE_IMAGE_KEY);
    return;
  }
  localStorage.setItem(CLIENT_PROFILE_IMAGE_KEY, trimmed);
}

export function hasClientCoverImageOverride() {
  try {
    return localStorage.getItem(CLIENT_COVER_IMAGE_KEY) !== null;
  } catch {
    return false;
  }
}

export function readClientCoverImageUrl() {
  try {
    const raw = localStorage.getItem(CLIENT_COVER_IMAGE_KEY);
    if (raw === null || raw === '') return null;
    return String(raw).trim() || null;
  } catch {
    return null;
  }
}

export function writeClientCoverImageUrl(url) {
  const trimmed = url == null || url === '' ? '' : String(url).trim();
  if (!trimmed) {
    localStorage.removeItem(CLIENT_COVER_IMAGE_KEY);
    return;
  }
  localStorage.setItem(CLIENT_COVER_IMAGE_KEY, trimmed);
}
