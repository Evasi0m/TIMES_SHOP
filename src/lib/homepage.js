import { getListingProductLink } from './listing-display.js';
import { ROUTER_BASENAME } from './config.js';

export const PRODUCT_ROW_SOURCES = [
  { id: 'best_selling', label: 'สินค้าขายดี' },
  { id: 'newest', label: 'สินค้ามาใหม่' },
  { id: 'popular', label: 'สินค้ายอดนิยม' },
];

export const BANNER_LAYOUTS = [
  { id: 'single', label: 'ภาพเดี่ยว' },
  { id: 'slide', label: 'สไลด์' },
  { id: 'bento', label: 'Bento grid' },
  { id: 'row', label: 'หลายภาพในแถวเดียว (1:1)' },
];

export const BANNER_ASPECTS = [
  { id: '16:9', label: '16:9 (แนวนอน)' },
  { id: '1:1', label: '1:1 (สี่เหลี่ยม)' },
];

export const BANNER_LINK_TYPE_OPTIONS = [
  { id: 'none', label: 'ไม่ลิงก์' },
  { id: 'product', label: 'ไปหน้าสินค้า' },
  { id: 'url', label: 'ลิงก์อื่น' },
];

const BANNER_LINK_TYPES = new Set(BANNER_LINK_TYPE_OPTIONS.map((o) => o.id));

function inferBannerLinkType(raw) {
  const explicit = String(raw?.link_type ?? '').trim();
  if (BANNER_LINK_TYPES.has(explicit)) return explicit;
  if (String(raw?.tiktok_product_id ?? '').trim()) return 'product';
  if (String(raw?.link_url ?? '').trim()) return 'url';
  return 'none';
}

function stripRouterBasename(path) {
  const base = ROUTER_BASENAME.replace(/\/$/, '');
  if (path.startsWith(`${base}/`)) return path.slice(base.length) || '/';
  if (path === base) return '/';
  return path;
}

/** Normalize banner image config (backward compat for legacy link_url-only rows). */
export function normalizeBannerImage(raw = {}) {
  const link_type = inferBannerLinkType(raw);
  return {
    image_url: String(raw.image_url ?? '').trim(),
    link_type,
    tiktok_product_id: String(raw.tiktok_product_id ?? '').trim(),
    tiktok_sku_id: String(raw.tiktok_sku_id ?? '').trim(),
    link_url: String(raw.link_url ?? '').trim(),
  };
}

/** Resolve storefront link for a banner image. */
export function resolveBannerLink(image) {
  const img = normalizeBannerImage(image);

  if (img.link_type === 'product' && img.tiktok_product_id) {
    const to = getListingProductLink({
      tiktok_product_id: img.tiktok_product_id,
      default_sku_id: img.tiktok_sku_id || undefined,
      tiktok_sku_id: img.tiktok_sku_id || undefined,
    });
    return { kind: 'internal', to };
  }

  if (img.link_type === 'url' && img.link_url) {
    if (/^https?:\/\//i.test(img.link_url)) {
      return { kind: 'external', href: img.link_url };
    }
    return { kind: 'internal', to: stripRouterBasename(img.link_url) };
  }

  return null;
}

/** Client-side validation for mock admin save (mirrors edge rules). */
export function validateBannerImageForSave(raw, label) {
  const imageUrl = String(raw?.image_url ?? '').trim();
  if (!imageUrl) throw new Error(`${label}: กรุณากรอก URL รูป`);
  if (!/^https?:\/\//i.test(imageUrl)) {
    throw new Error(`${label}: URL รูปต้องขึ้นต้นด้วย http หรือ https`);
  }

  const linkType = inferBannerLinkType(raw);
  if (linkType === 'none') {
    return { image_url: imageUrl, link_type: 'none' };
  }

  if (linkType === 'product') {
    const productId = String(raw.tiktok_product_id ?? '').trim();
    if (!productId) throw new Error(`${label}: กรุณากรอก TikTok Product ID`);
    if (!/^\d+$/.test(productId)) throw new Error(`${label}: Product ID ต้องเป็นตัวเลข`);
    const skuRaw = String(raw.tiktok_sku_id ?? '').trim();
    if (skuRaw && !/^\d+$/.test(skuRaw)) throw new Error(`${label}: SKU ID ต้องเป็นตัวเลข`);
    return {
      image_url: imageUrl,
      link_type: 'product',
      tiktok_product_id: productId,
      tiktok_sku_id: skuRaw || null,
    };
  }

  const linkUrl = String(raw.link_url ?? '').trim();
  if (!linkUrl) throw new Error(`${label}: กรุณากรอกลิงก์`);
  if (/^https?:\/\//i.test(linkUrl)) {
    return { image_url: imageUrl, link_type: 'url', link_url: linkUrl };
  }
  if (!linkUrl.startsWith('/catalog') && !linkUrl.startsWith('/product/')) {
    throw new Error(`${label}: path ต้องขึ้นต้นด้วย /catalog หรือ /product/`);
  }
  return { image_url: imageUrl, link_type: 'url', link_url: linkUrl };
}

export function getProductRowTitle(source, fallback = '') {
  return PRODUCT_ROW_SOURCES.find((s) => s.id === source)?.label || fallback || 'สินค้าแนะนำ';
}

export function getProductRowSeeAllHref(source) {
  if (source === 'best_selling') return '/catalog?sort=best_selling';
  if (source === 'newest') return '/catalog?sort=newest';
  return '/catalog';
}

export function getCatalogSortForSource(source) {
  if (source === 'best_selling') return 'best_selling';
  if (source === 'newest') return 'newest';
  return null;
}

/** Homepage product rows — always group by TikTok listing (ตะกร้า). */
export function buildHomeCatalogParams({ page_size = 8, sort = 'newest' } = {}) {
  return {
    page: 1,
    page_size,
    sort,
    group_by: 'product',
    include_facets: false,
    include_items: true,
  };
}

export function buildViewSnapshot(product) {
  if (!product?.tiktok_product_id) return null;
  return {
    tiktok_product_id: product.tiktok_product_id,
    product_name: product.product_name,
    image_url: product.image_url ?? product.listing_image_url,
    listing_image_url: product.listing_image_url ?? product.image_url,
    price_min: product.price_min ?? product.unit_price,
    price_max: product.price_max ?? product.unit_price,
    price_min_in_stock: product.price_min_in_stock ?? product.price_min ?? product.unit_price,
    default_sku_id: product.default_sku_id ?? product.tiktok_sku_id,
    tiktok_sku_id: product.tiktok_sku_id ?? product.default_sku_id,
    sku_count: product.sku_count,
    units_sold: product.units_sold,
    in_stock: product.in_stock,
    stock_available: product.stock_available,
  };
}

const VIEW_THROTTLE_PREFIX = 'times_shop_view_';

export function shouldTrackProductView(productId) {
  try {
    const key = `${VIEW_THROTTLE_PREFIX}${productId}`;
    if (sessionStorage.getItem(key)) return false;
    sessionStorage.setItem(key, '1');
    return true;
  } catch {
    return true;
  }
}

export function createEmptyBannerImage() {
  return {
    image_url: '',
    link_type: 'none',
    tiktok_product_id: '',
    tiktok_sku_id: '',
    link_url: '',
  };
}

export function createEmptyBlock(kind, sortOrder = 0) {
  if (kind === 'banner') {
    return {
      id: crypto.randomUUID(),
      kind: 'banner',
      title: 'แบนเนอร์ใหม่',
      config: { layout: 'slide', aspect: '16:9', images: [createEmptyBannerImage()] },
      sort_order: sortOrder,
      is_active: true,
    };
  }
  if (kind === 'product_row') {
    return {
      id: crypto.randomUUID(),
      kind: 'product_row',
      title: 'สินค้าขายดี',
      config: { source: 'best_selling', limit: 10 },
      sort_order: sortOrder,
      is_active: true,
    };
  }
  return {
    id: crypto.randomUUID(),
    kind: 'coupon_row',
    title: 'คูปองส่วนลด',
    config: {},
    sort_order: sortOrder,
    is_active: true,
  };
}
