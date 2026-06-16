// Customer-facing product label — CASIO model codes from sku_name, not TikTok listing title.

import {
  getCasioModelFull,
  getModelCode,
  getProductDisplayLines,
  getProductImageAlt,
} from './casio/model-display.js';

export { getProductDisplayLines, getProductImageAlt, getModelCode, getCasioModelFull };
export { getCasioModelBase } from './casio/parse-model.js';

/** True when product_name indicates Casio brand (listing or SKU card). */
export function isCasioBrandProduct(product) {
  return /\bcasio\b/i.test(String(product?.product_name || ''));
}

/** Full SKU code — for cart keys, search context, order lines. */
export function getSkuDisplayName(product) {
  if (!product) return 'สินค้า';
  const code = getModelCode(product);
  if (code) return getCasioModelFull(code);
  return product.product_name || 'สินค้า';
}
