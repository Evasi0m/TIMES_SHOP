/** Parse CASIO model code from sku_name / seller_sku (see Product_filter.md). */

import { VALID_STRAP_MATERIALS } from './maps.js';

export function normalizeModelCode(code) {
  return String(code || '').trim().toUpperCase();
}

/** Full model code after normalize. */
export function getCasioModelFull(code) {
  const full = normalizeModelCode(code);
  return full || '';
}

/**
 * Base model without color/variant suffix (e.g. W-219HC-3B → W-219HC).
 * Last segment must match /^[1-9][A-Z0-9]*$/i
 */
export function getCasioModelBase(code) {
  const full = getCasioModelFull(code);
  if (!full) return '';
  const parts = full.split('-');
  if (parts.length < 2) return full;
  const last = parts[parts.length - 1];
  if (/^[1-9][A-Z0-9]*$/i.test(last)) {
    return parts.slice(0, -1).join('-');
  }
  return full;
}

/** Material + dial color code from model (Product_filter.md §7–§8). */
export function parseCasioModel(code) {
  const m = normalizeModelCode(code);
  if (!m) return { mat: '', color: '' };

  const parts = m.split('-');
  if (parts.length < 2) return { mat: '', color: '' };

  let mat = '';
  const mid = parts[1];
  const matMatch = mid.match(/\d([A-Z]{1,2})$/);
  if (matMatch && VALID_STRAP_MATERIALS.has(matMatch[1])) {
    mat = matMatch[1];
  }

  let color = '';
  const last = parts[parts.length - 1];
  const cm = last.match(/^([1-9])/);
  if (cm) color = cm[1];

  return { mat, color };
}

/** Leading alpha prefix (GA, MTP, W, …). */
export function getPrefix(code) {
  const m = normalizeModelCode(code);
  const pm = m.match(/^([A-Z]+)/);
  return pm ? pm[1] : '';
}
