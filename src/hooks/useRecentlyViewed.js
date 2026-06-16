const STORAGE_KEY = 'times_shop_recently_viewed_v1';
const MAX_ITEMS = 12;

function readRecent() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRecent(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
  } catch {
    /* ignore */
  }
}

/** Track a viewed product/SKU in localStorage. */
export function trackRecentlyViewed(product) {
  if (!product?.tiktok_sku_id && !product?.tiktok_product_id) return;
  const entry = {
    tiktok_sku_id: product.tiktok_sku_id,
    tiktok_product_id: product.tiktok_product_id,
    product_name: product.product_name,
    sku_name: product.sku_name,
    image_url: product.image_url || product.listing_image_url,
    unit_price: product.unit_price ?? product.price_min,
    viewed_at: Date.now(),
  };
  const prev = readRecent().filter(
    (p) => p.tiktok_sku_id !== entry.tiktok_sku_id && p.tiktok_product_id !== entry.tiktok_product_id,
  );
  writeRecent([entry, ...prev]);
}

export function getRecentlyViewed(excludeSkuId = null) {
  return readRecent().filter((p) => p.tiktok_sku_id !== excludeSkuId);
}
