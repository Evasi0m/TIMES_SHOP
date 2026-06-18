import { COLOR_MAP, MATERIAL_MAP } from './casio/maps.js';
import { SERIES_RULES } from './casio/series-rules.js';
import { SERIES_SUBS } from './casio/sub-type-rules.js';

export const SORT_OPTIONS = [
  { id: 'newest', label: 'ใหม่ล่าสุด' },
  { id: 'best_selling', label: 'สินค้าขายดี' },
  { id: 'price_asc', label: 'ราคา: ต่ำ → สูง' },
  { id: 'price_desc', label: 'ราคา: สูง → ต่ำ' },
];

export const PRICE_PRESETS = [
  { id: 'lt1k', label: '< ฿1,000', min: 0, max: 999 },
  { id: '1-5k', label: '฿1,000–5,000', min: 1000, max: 5000 },
  { id: '5-10k', label: '฿5,000–10,000', min: 5000, max: 10000 },
  { id: 'gt10k', label: '฿10,000+', min: 10000, max: 0 },
];

const VALID_SERIES = new Set(SERIES_RULES.map((r) => r.id));
const VALID_SORT = new Set(SORT_OPTIONS.map((s) => s.id));
const VALID_MAT = new Set(Object.keys(MATERIAL_MAP));
const VALID_COLOR = new Set(Object.keys(COLOR_MAP));

export function getAllSubTypeIds() {
  const ids = new Set();
  for (const subs of Object.values(SERIES_SUBS)) {
    for (const s of subs) ids.add(s.id);
  }
  return ids;
}

const VALID_SUB = getAllSubTypeIds();

export function normalizePriceRange(minRaw, maxRaw) {
  let min = Math.max(0, Number(minRaw) || 0);
  let max = Math.max(0, Number(maxRaw) || 0);
  if (min > 0 && max > 0 && min > max) [min, max] = [max, min];
  return { min, max };
}

export function parseCatalogParams(searchParams) {
  const q = (searchParams.get('q') || '').trim();
  const seriesRaw = searchParams.get('series') || '';
  const series = VALID_SERIES.has(seriesRaw) ? seriesRaw : '';
  const subRaw = searchParams.get('sub') || '';
  const sub = VALID_SUB.has(subRaw) ? subRaw : '';
  const matRaw = (searchParams.get('mat') || '').trim().toUpperCase();
  const mat = VALID_MAT.has(matRaw) ? matRaw : '';
  const colorRaw = searchParams.get('color') || '';
  const color = VALID_COLOR.has(colorRaw) ? colorRaw : '';
  const { min, max } = normalizePriceRange(searchParams.get('min'), searchParams.get('max'));
  const sortRaw = searchParams.get('sort') || 'newest';
  const sort = VALID_SORT.has(sortRaw) ? sortRaw : 'newest';
  const page = Math.max(1, Number(searchParams.get('page') || '1') || 1);

  return { q, series, sub, mat, color, min, max, sort, page };
}

export function buildCatalogApiParams(filters, { pageSize = 24 } = {}) {
  const { q, series, sub, mat, color, min, max, sort, page } = filters;
  const params = {
    page,
    page_size: pageSize,
    sort,
    group_by: 'product',
    include_facets: false,
    include_items: true,
  };
  if (q) params.q = q;
  else if (series) params.series = series;
  if (sub) params.sub_type = sub;
  if (mat) params.strap_material = mat;
  if (color) params.dial_color = color;
  if (min > 0) params.price_min = min;
  if (max > 0) params.price_max = max;
  return params;
}

/** Facet counts only — skips listing/SKU payload. */
export function buildCatalogFacetParams(filters) {
  const { q, series, sub, mat, color, min, max, sort } = filters;
  const params = {
    page: 1,
    page_size: 1,
    sort,
    group_by: 'product',
    include_facets: true,
    include_items: false,
  };
  if (q) params.q = q;
  else if (series) params.series = series;
  if (sub) params.sub_type = sub;
  if (mat) params.strap_material = mat;
  if (color) params.dial_color = color;
  if (min > 0) params.price_min = min;
  if (max > 0) params.price_max = max;
  return params;
}

export function countActiveFilters(filters) {
  let n = 0;
  if (filters.series) n++;
  if (filters.sub) n++;
  if (filters.mat) n++;
  if (filters.color) n++;
  return n;
}

export function hasPriceFilter(filters) {
  return filters.min > 0 || filters.max > 0;
}

export function hasAnyCatalogFilter(filters) {
  return countActiveFilters(filters) > 0 || hasPriceFilter(filters) || Boolean(filters.q);
}

export function getSeriesLabel(seriesId) {
  return SERIES_RULES.find((r) => r.id === seriesId)?.label || seriesId;
}

export function getSubTypeLabel(seriesId, subId) {
  return SERIES_SUBS[seriesId]?.find((s) => s.id === subId)?.label || subId;
}

export function getMaterialLabel(code) {
  return MATERIAL_MAP[code] || null;
}

/** Facet materials — hide unknown codes from the UI. */
export function visibleMaterialFacets(materials = []) {
  return materials.filter((m) => MATERIAL_MAP[m.id]);
}

export function getColorLabel(code) {
  return COLOR_MAP[code]?.label || code;
}

export function formatPriceFilterLabel(min, max) {
  if (min > 0 && max > 0) return `฿${min.toLocaleString()}–${max.toLocaleString()}`;
  if (min > 0) return `฿${min.toLocaleString()}+`;
  if (max > 0) return `< ฿${max.toLocaleString()}`;
  return '';
}
