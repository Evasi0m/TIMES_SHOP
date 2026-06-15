import { getCasioModelBase, getCasioModelFull } from './parse-model.js';

export function getModelCode(product) {
  if (!product) return '';
  return String(product.sku_name || product.seller_sku || '').trim();
}

export { getCasioModelBase, getCasioModelFull };

/**
 * Two-line product label: title = base model, subtitle = full SKU (if different).
 */
export function getProductDisplayLines(product) {
  const code = getModelCode(product);
  if (!code) {
    const fallback = product?.product_name || 'สินค้า';
    return { title: fallback, subtitle: '', full: fallback, base: fallback };
  }

  const full = getCasioModelFull(code);
  const base = getCasioModelBase(code);
  const title = base || full;
  const subtitle = full && full !== title ? full : '';

  return { title, subtitle, full, base: title };
}

/** Accessibility alt: "W-219HC W-219HC-3B" or single name. */
export function getProductImageAlt(product) {
  const { title, subtitle } = getProductDisplayLines(product);
  return subtitle ? `${title} ${subtitle}` : title;
}
