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
  const cover = product.listing_image_url || product.image_url;
  const entry = {
    tiktok_sku_id: product.tiktok_sku_id ?? product.default_sku_id,
    tiktok_product_id: product.tiktok_product_id,
    product_name: product.product_name,
    sku_name: product.sku_name,
    listing_image_url: cover,
    image_url: cover,
    unit_price: product.unit_price ?? product.price_min,
    price_min: product.price_min ?? product.unit_price,
    price_max: product.price_max ?? product.unit_price,
    price_min_in_stock: product.price_min_in_stock ?? product.price_min ?? product.unit_price,
    default_sku_id: product.default_sku_id ?? product.tiktok_sku_id,
    sku_count: product.sku_count,
    units_sold: product.units_sold,
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
