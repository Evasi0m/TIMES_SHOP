export const NEW_PRODUCT_DAYS = 30;
export const NEW_PRODUCT_WINDOW_MS = NEW_PRODUCT_DAYS * 24 * 60 * 60 * 1000;

/** @param {{ created_at?: string | null }} product */
export function isNewProduct(product, now = Date.now()) {
  const t = product?.created_at ? new Date(product.created_at).getTime() : NaN;
  return Number.isFinite(t) && now - t < NEW_PRODUCT_WINDOW_MS;
}
