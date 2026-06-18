import { fmtTHB, roundMoney } from './money.js';

/** Catalog card backed by shop-get-catalog group_by:product item. */
export function isListingCard(item) {
  return Boolean(item?.tiktok_product_id && item?.sku_count != null);
}

export function getListingCardImage(item) {
  if (!item) return null;
  return item.listing_image_url || item.image_url || null;
}

/** Prefer listing cover over default SKU image for catalog cards. */
export function normalizeListingItem(item) {
  if (!item) return item;
  if (!isListingCard(item)) return item;
  const cover = getListingCardImage(item);
  return {
    ...item,
    image_url: cover,
    listing_image_url: cover || item.listing_image_url,
  };
}

export function normalizeListingItems(items = []) {
  return items.map(normalizeListingItem);
}

export function getListingProductLink(item) {
  if (item?.tiktok_product_id) {
    const sku = item.default_sku_id || item.tiktok_sku_id;
    const qs = sku ? `?sku=${encodeURIComponent(sku)}` : '';
    return `/product/p/${item.tiktok_product_id}${qs}`;
  }
  return `/product/${item.tiktok_sku_id}`;
}

export function getListingCardTitle(item) {
  return item?.product_name || 'สินค้า';
}

export function getListingCardSubtitle(item) {
  const count = Number(item?.sku_count) || 0;
  if (count > 1) return '';
  return item?.sku_name || '';
}

export function formatListingSkuOptions(count) {
  const n = Number(count) || 0;
  if (n <= 1) return null;
  return `${n.toLocaleString('th-TH')} ตัวเลือก`;
}

export function formatListingPrice(item) {
  const min = Number(item?.price_min ?? item?.unit_price) || 0;
  const max = Number(item?.price_max ?? item?.unit_price) || 0;
  if (min > 0 && max > min) {
    const minStr = roundMoney(min).toLocaleString('th-TH');
    const maxStr = roundMoney(max).toLocaleString('th-TH');
    return `฿${minStr}-${maxStr}`;
  }
  return fmtTHB(min || max);
}

/** Label for variant chip — prefer sales_attributes, then sku_name. */
export function getVariantLabel(sku) {
  const attrs = sku?.sales_attributes;
  if (Array.isArray(attrs) && attrs.length) {
    return attrs.map((a) => a.value_name).filter(Boolean).join(' / ');
  }
  return sku?.sku_name || sku?.seller_sku || 'ตัวเลือก';
}

export function computeListingPriceRange(skus = []) {
  const prices = skus
    .map((s) => Number(s?.unit_price) || 0)
    .filter((p) => p > 0);
  if (!prices.length) return { min: 0, max: 0 };
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

/** Lowest unit_price among in-stock SKUs; falls back to all SKUs if none in stock. */
export function computeInStockPriceMin(skus = []) {
  const inStockPrices = skus
    .filter((s) => s.in_stock ?? Number(s.stock_available) > 0)
    .map((s) => Number(s?.unit_price) || 0)
    .filter((p) => p > 0);
  if (inStockPrices.length) return Math.min(...inStockPrices);
  const { min } = computeListingPriceRange(skus);
  return min;
}

/** Single display price for catalog listing cards. */
export function getListingCardDisplayPrice(item) {
  const inStockMin = Number(item?.price_min_in_stock);
  if (Number.isFinite(inStockMin) && inStockMin > 0) return inStockMin;
  return Number(item?.price_min ?? item?.unit_price) || 0;
}

export function computeListingUnitsSold(skus = []) {
  return skus.reduce((sum, s) => sum + (Number(s?.units_sold) || 0), 0);
}

export function getVariantAttributeName(skus = []) {
  for (const sku of skus) {
    const attrs = sku?.sales_attributes;
    if (Array.isArray(attrs) && attrs[0]?.name) return String(attrs[0].name);
  }
  return 'ตัวเลือก';
}

export function getListingCoverImage(listing, skus = []) {
  const fromListing = String(listing?.listing_image_url || '').trim();
  if (fromListing) return fromListing;
  for (const sku of skus) {
    const cover = String(sku?.listing_image_url || '').trim();
    if (cover) return cover;
  }
  return skus[0]?.image_url || null;
}

/** PDP hero slides: listing cover first, then unique SKU images. */
export function getListingGalleryImages(listing, skus = []) {
  const seen = new Set();
  const urls = [];
  const cover = getListingCoverImage(listing, skus);
  if (cover) {
    seen.add(cover);
    urls.push(cover);
  }
  for (const sku of skus) {
    const url = String(sku?.image_url || '').trim();
    if (!url || seen.has(url)) continue;
    seen.add(url);
    urls.push(url);
  }
  return urls;
}

export function formatListingPriceFromSkus(skus = []) {
  const { min, max } = computeListingPriceRange(skus);
  if (min > 0 && max > min) {
    const minStr = roundMoney(min).toLocaleString('th-TH');
    const maxStr = roundMoney(max).toLocaleString('th-TH');
    return `฿${minStr}-${maxStr}`;
  }
  return fmtTHB(min || max);
}

export function pickDefaultSku(skus = []) {
  if (!skus.length) return null;
  const inStock = skus.filter((s) => s.in_stock ?? s.stock_available > 0);
  const pool = inStock.length ? inStock : skus;
  return pool.reduce((best, cur) => {
    const bestPrice = Number(best?.unit_price) || Infinity;
    const curPrice = Number(cur?.unit_price) || Infinity;
    return curPrice < bestPrice ? cur : best;
  });
}
