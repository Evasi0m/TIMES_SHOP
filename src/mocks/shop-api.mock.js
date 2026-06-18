// DEV-ONLY mock — NOT POS products, NOT real TikTok data.
// Production catalog: shop-get-catalog → storefront_products (synced from TikTok Shop API).

import { DEFAULT_SHIPPING_FEE, normalizeShippingFee } from '../lib/shipping.js';
import { getClientShippingInfo, readClientCoverImageUrl, readClientProfileImageUrl, writeClientCoverImageUrl, writeClientProfileImageUrl, writeClientShippingFee } from '../lib/shipping-store.js';
import {
  getMockAnnouncementState,
  getPublicAnnouncement,
  saveMockAnnouncement,
} from '../lib/announcement-store.js';
import {
  getMockHomepageBlocks,
  getPublicHomepageBlocks,
  saveMockHomepageBlocks,
  trackMockProductView,
  validateMockHomepageBlock,
} from '../lib/homepage-store.js';
import {
  adminDistributePromo,
  adminListCustomers,
  adminListPromos,
  adminRevokePromo,
  adminUpsertPromo,
  computeOrderPromoTotals,
  getActivePromosForUser,
  getWalletPromosForUser,
  incrementPromoUsage,
  readPromoCodes,
  readPromoGrants,
  writePromoGrants,
} from './promo.mock.js';
import { enrichCasioFromModelCode } from '../lib/casio/enrich.js';
import { parseDescriptionSpecs } from '../lib/product-description-format.js';
import { COLOR_MAP, MATERIAL_MAP } from '../lib/casio/maps.js';
import { SERIES_RULES } from '../lib/casio/series-rules.js';
import { SERIES_SUBS } from '../lib/casio/sub-type-rules.js';
import { getCasioModelBase } from '../lib/casio/parse-model.js';
import { computeInStockPriceMin, computeListingUnitsSold } from '../lib/listing-display.js';

const IMG = (seed) =>
  `https://picsum.photos/seed/${seed}/600/600`;

const daysAgoIso = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

function enrichProduct(p) {
  const code = String(p.seller_sku || p.sku_name || '').trim();
  const e = enrichCasioFromModelCode(code);
  return { ...p, _enriched: e, _model_base: getCasioModelBase(code) };
}

function applyMockCatalogFilters(list, opts) {
  const q = String(opts.q || '').trim();
  let priceMin = Math.max(0, Number(opts.price_min) || 0);
  let priceMax = Math.max(0, Number(opts.price_max) || 0);
  if (priceMin > 0 && priceMax > 0 && priceMin > priceMax) [priceMin, priceMax] = [priceMax, priceMin];

  let out = list;
  if (!q && opts.series) {
    out = out.filter((p) => p._enriched.watch_series === opts.series);
  }
  if (opts.sub_type) {
    out = out.filter((p) => p._enriched.watch_sub_type === opts.sub_type);
  }
  if (q) {
    const needle = q.toLowerCase();
    out = out.filter(
      (p) =>
        p._model_base.toLowerCase().includes(needle) ||
        (p.sku_name || '').toLowerCase().includes(needle) ||
        (p.seller_sku || '').toLowerCase().includes(needle) ||
        p.product_name.toLowerCase().includes(needle),
    );
  }
  if (priceMin > 0) out = out.filter((p) => p.unit_price >= priceMin);
  if (priceMax > 0) out = out.filter((p) => p.unit_price <= priceMax);
  if (opts.strap_material) {
    out = out.filter((p) => p._enriched.strap_material === opts.strap_material);
  }
  if (opts.dial_color) {
    out = out.filter((p) => p._enriched.dial_color_code === opts.dial_color);
  }
  return out;
}

function buildMockFacets(all, filters) {
  const countField = (rows, pick) => {
    const m = new Map();
    for (const row of rows) {
      const key = pick(row);
      if (!key) continue;
      m.set(key, (m.get(key) || 0) + 1);
    }
    return m;
  };

  const seriesCounts = countField(
    applyMockCatalogFilters(all, { ...filters, series: undefined }),
    (p) => p._enriched.watch_series,
  );
  const subCounts = countField(
    applyMockCatalogFilters(all, { ...filters, sub_type: undefined }),
    (p) => p._enriched.watch_sub_type,
  );
  const matCounts = countField(
    applyMockCatalogFilters(all, { ...filters, strap_material: undefined }),
    (p) => p._enriched.strap_material,
  );
  const colorCounts = countField(
    applyMockCatalogFilters(all, { ...filters, dial_color: undefined }),
    (p) => p._enriched.dial_color_code,
  );
  const priceRows = applyMockCatalogFilters(all, {
    ...filters,
    price_min: 0,
    price_max: 0,
  });

  const series = SERIES_RULES.map((r) => ({
    id: r.id,
    label: r.label,
    count: seriesCounts.get(r.id) || 0,
  })).filter((x) => x.count > 0);

  const seriesForSubs = filters.series || 'standard';
  const sub_types = (SERIES_SUBS[seriesForSubs] || [])
    .map((s) => ({ id: s.id, label: s.label, count: subCounts.get(s.id) || 0 }))
    .filter((x) => x.count > 0);

  const materials = [...matCounts.entries()]
    .filter(([id]) => MATERIAL_MAP[id])
    .map(([id, count]) => ({ id, label: MATERIAL_MAP[id] || id, count }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count);

  const colors = [...colorCounts.entries()]
    .map(([id, count]) => ({
      id,
      label: COLOR_MAP[id]?.label || id,
      hex: COLOR_MAP[id]?.hex || '#9ca3af',
      count,
    }))
    .filter((x) => x.count > 0)
    .sort((a, b) => Number(a.id) - Number(b.id));

  let min = 0;
  let max = 0;
  for (const p of priceRows) {
    if (p.unit_price <= 0) continue;
    if (!min || p.unit_price < min) min = p.unit_price;
    if (p.unit_price > max) max = p.unit_price;
  }

  return { series, sub_types, materials, colors, price_range: { min, max } };
}

const PRODUCTS = [
  {
    tiktok_sku_id: '1734123456789012301',
    tiktok_product_id: '1734098765432109801',
    product_name: 'Seiko 5 Sports SRPD',
    sku_name: 'หน้าปัดดำ / สายเหล็ก',
    seller_sku: 'SRPD55K1',
    image_url: IMG('seiko-srpd'),
    unit_price: 9900,
    stock_available: 4,
    units_sold: 128,
    created_at: daysAgoIso(3),
  },
  {
    tiktok_sku_id: '1734123456789012302',
    tiktok_product_id: '1734098765432109802',
    product_name: 'Casio G-Shock GA-2100',
    sku_name: 'CasiOak สีดำ',
    seller_sku: 'GA-2100-1A1',
    image_url: IMG('gshock-2100-black'),
    listing_image_url: IMG('gshock-2100-cover'),
    unit_price: 4200,
    stock_available: 12,
    units_sold: 42,
    sales_attributes: [{ name: 'สี', value_name: 'ดำ' }],
    created_at: daysAgoIso(7),
  },
  {
    tiktok_sku_id: '1734123456789012302b',
    tiktok_product_id: '1734098765432109802',
    product_name: 'Casio G-Shock GA-2100',
    sku_name: 'CasiOak สีขาว',
    seller_sku: 'GA-2100-7A1',
    image_url: IMG('gshock-2100-white'),
    listing_image_url: IMG('gshock-2100-cover'),
    unit_price: 4500,
    stock_available: 5,
    units_sold: 18,
    sales_attributes: [{ name: 'สี', value_name: 'ขาว' }],
    created_at: daysAgoIso(12),
  },
  {
    tiktok_sku_id: '1734123456789012302c',
    tiktok_product_id: '1734098765432109802',
    product_name: 'Casio G-Shock GA-2100',
    sku_name: 'CasiOak สีแดง',
    seller_sku: 'GA-2100-4A1',
    image_url: IMG('gshock-2100-red'),
    listing_image_url: IMG('gshock-2100-cover'),
    unit_price: 3900,
    stock_available: 0,
    units_sold: 9,
    sales_attributes: [{ name: 'สี', value_name: 'แดง' }],
    created_at: daysAgoIso(20),
  },
  {
    tiktok_sku_id: '1734123456789012303',
    tiktok_product_id: '1734098765432109803',
    product_name: 'Orient Bambino V2',
    sku_name: 'หน้าปัดขาว / สายหนัง',
    seller_sku: 'FAC00009N0',
    image_url: IMG('orient-bambino'),
    unit_price: 6500,
    stock_available: 0,
    units_sold: 0,
    created_at: daysAgoIso(45),
  },
  {
    tiktok_sku_id: '1734123456789012304',
    tiktok_product_id: '1734098765432109804',
    product_name: 'Citizen Eco-Drive',
    sku_name: 'หน้าปัดเงิน / Titanium',
    seller_sku: 'BM7108-22A',
    image_url: IMG('citizen-eco'),
    unit_price: 11900,
    stock_available: 3,
    units_sold: 7,
    created_at: daysAgoIso(2),
  },
  {
    tiktok_sku_id: '1734123456789012305',
    tiktok_product_id: '1734098765432109805',
    product_name: 'Casio Vintage A158',
    sku_name: 'สีเงิน',
    seller_sku: 'A158WA-1',
    image_url: IMG('casio-a158'),
    unit_price: 1290,
    stock_available: 25,
    units_sold: 0,
    created_at: daysAgoIso(90),
  },
  {
    tiktok_sku_id: '1734123456789012306',
    tiktok_product_id: '1734098765432109806',
    product_name: 'Seiko Presage Cocktail',
    sku_name: 'Star Bar / หน้าปัดน้ำเงิน',
    seller_sku: 'SRPB41J1',
    image_url: IMG('seiko-presage'),
    unit_price: 16900,
    stock_available: 2,
    units_sold: 15,
    created_at: daysAgoIso(14),
  },
  {
    tiktok_sku_id: '1734123456789012307',
    tiktok_product_id: '1734098765432109807',
    product_name: 'Timex Weekender',
    sku_name: 'สายผ้า NATO เทา',
    seller_sku: 'TW2R63300',
    image_url: IMG('timex-weekender'),
    unit_price: 2490,
    stock_available: 8,
    created_at: daysAgoIso(55),
  },
  {
    tiktok_sku_id: '1734123456789012308',
    tiktok_product_id: '1734098765432109808',
    product_name: 'Tissot PRX Powermatic 80',
    sku_name: 'หน้าปัดน้ำเงิน / สายเหล็ก',
    seller_sku: 'T137.407.11.041.00',
    image_url: IMG('tissot-prx'),
    unit_price: 24900,
    stock_available: 1,
    units_sold: 3,
    created_at: daysAgoIso(1),
  },
];

const ENRICHED_PRODUCTS = PRODUCTS.map(enrichProduct);

function toCatalogItem(p) {
  const { _enriched, _model_base, ...rest } = p;
  const item = {
    ...rest,
    in_stock: p.stock_available > 0,
    units_sold: Number(p.units_sold) || 0,
  };
  if (p.sales_attributes) item.sales_attributes = p.sales_attributes;
  return item;
}

function listingGroupKey(row) {
  return row.tiktok_product_id || `sku:${row.tiktok_sku_id}`;
}

function pickDefaultSkuItem(skus) {
  if (!skus.length) return null;
  const inStock = skus.filter((s) => s.stock_available > 0);
  const pool = inStock.length ? inStock : skus;
  return pool.reduce((best, cur) => {
    const bestPrice = Number(best.unit_price) || Infinity;
    const curPrice = Number(cur.unit_price) || Infinity;
    return curPrice < bestPrice ? cur : best;
  });
}

function pickListingCoverImage(rows) {
  for (const row of rows) {
    const cover = String(row.listing_image_url || '').trim();
    if (cover) return cover;
  }
  const sorted = [...rows].sort((a, b) =>
    String(a.tiktok_sku_id).localeCompare(String(b.tiktok_sku_id)));
  for (const row of sorted) {
    const url = String(row.image_url || '').trim();
    if (url) return url;
  }
  return null;
}

function pickListingCreatedAt(rows) {
  let newest = null;
  for (const row of rows) {
    if (!row.created_at) continue;
    const t = new Date(row.created_at).getTime();
    if (!Number.isFinite(t)) continue;
    if (newest == null || t > newest) newest = t;
  }
  return newest != null ? new Date(newest).toISOString() : undefined;
}

function toListingCatalogItem(rows) {
  if (!rows.length) return null;
  const skus = rows.map(toCatalogItem);
  const prices = skus.map((s) => s.unit_price).filter((p) => p > 0);
  const priceMin = prices.length ? Math.min(...prices) : 0;
  const priceMax = prices.length ? Math.max(...prices) : 0;
  const priceMinInStock = computeInStockPriceMin(skus);
  const defaultSku = pickDefaultSkuItem(rows);
  const coverImage = pickListingCoverImage(rows);
  const created_at = pickListingCreatedAt(rows);
  return {
    tiktok_product_id: rows[0].tiktok_product_id || null,
    product_name: rows[0].product_name,
    image_url: coverImage,
    listing_image_url: coverImage,
    sku_count: skus.length,
    price_min: priceMin,
    price_max: priceMax,
    price_min_in_stock: priceMinInStock,
    unit_price: priceMinInStock || priceMin,
    default_sku_id: defaultSku?.tiktok_sku_id || skus[0]?.tiktok_sku_id,
    tiktok_sku_id: defaultSku?.tiktok_sku_id || skus[0]?.tiktok_sku_id,
    in_stock: skus.some((s) => s.in_stock),
    stock_available: skus.reduce((sum, s) => sum + (s.stock_available || 0), 0),
    units_sold: computeListingUnitsSold(skus),
    ...(created_at ? { created_at } : {}),
  };
}

function groupSkusIntoListings(rows, sort = 'newest') {
  const groups = new Map();
  for (const row of rows) {
    const key = listingGroupKey(row);
    const bucket = groups.get(key) || [];
    bucket.push(row);
    groups.set(key, bucket);
  }
  let listings = [...groups.values()].map(toListingCatalogItem).filter(Boolean);
  if (sort === 'price_asc') listings.sort((a, b) => a.price_min - b.price_min);
  if (sort === 'price_desc') listings.sort((a, b) => b.price_max - a.price_max);
  if (sort === 'best_selling') listings.sort((a, b) => (b.units_sold || 0) - (a.units_sold || 0));
  return listings;
}

function findProduct(skuId) {
  return PRODUCTS.find((p) => p.tiktok_sku_id === skuId) || null;
}

function findProductsByListing(productId) {
  return PRODUCTS.filter((p) => p.tiktok_product_id === productId);
}

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

// ---- Mock persistence for addresses (per browser) ----
const ADDR_KEY = 'times_shop_mock_addresses';
const readAddrs = () => {
  try {
    return JSON.parse(localStorage.getItem(ADDR_KEY) || '[]');
  } catch {
    return [];
  }
};
const writeAddrs = (a) => localStorage.setItem(ADDR_KEY, JSON.stringify(a));

function getMockShippingInfo() {
  return getClientShippingInfo();
}

const ORDERS_KEY = 'times_shop_mock_orders';
const readOrders = () => {
  try {
    return JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
  } catch {
    return [];
  }
};
const writeOrders = (o) => localStorage.setItem(ORDERS_KEY, JSON.stringify(o));

let orderSeq = 1000;

export const mockApi = {
  async getCatalog({
    page = 1,
    page_size = 24,
    q = '',
    sort = 'newest',
    series = '',
    sub_type = '',
    strap_material = '',
    dial_color = '',
    price_min = 0,
    price_max = 0,
    include_facets = false,
    include_items = true,
    group_by = 'product',
  } = {}) {
    await delay();
    const filterOpts = {
      q,
      series,
      sub_type,
      strap_material,
      dial_color,
      price_min,
      price_max,
    };
    const result = {
      ok: true,
      items: [],
      total: 0,
      page,
      page_size,
      group_by: group_by === 'sku' ? 'sku' : 'product',
    };
    if (include_facets) {
      result.facets = buildMockFacets(ENRICHED_PRODUCTS, filterOpts);
    }
    if (!include_items) return result;

    const filtered = applyMockCatalogFilters(ENRICHED_PRODUCTS, filterOpts);
    const useSku = group_by === 'sku';
    let list = useSku
      ? filtered.map(toCatalogItem)
      : groupSkusIntoListings(filtered, sort);
    if (useSku) {
      if (sort === 'price_asc') list = [...list].sort((a, b) => a.unit_price - b.unit_price);
      if (sort === 'price_desc') list = [...list].sort((a, b) => b.unit_price - a.unit_price);
      if (sort === 'best_selling') list = [...list].sort((a, b) => (b.units_sold || 0) - (a.units_sold || 0));
    }
    const total = list.length;
    const start = (page - 1) * page_size;
    result.items = list.slice(start, start + page_size);
    result.total = total;
    return result;
  },

  async getProduct({ tiktok_sku_id, tiktok_product_id } = {}) {
    await delay();
    let siblings = [];
    let selectedSkuId = String(tiktok_sku_id || '').trim();

    if (tiktok_product_id) {
      siblings = findProductsByListing(tiktok_product_id);
    } else if (selectedSkuId) {
      const anchor = findProduct(selectedSkuId);
      if (!anchor) return { ok: false, error: 'not_found', message: 'ไม่พบสินค้า' };
      siblings = anchor.tiktok_product_id
        ? findProductsByListing(anchor.tiktok_product_id)
        : [anchor];
    } else {
      return { ok: false, error: 'validation_failed', message: 'tiktok_sku_id or tiktok_product_id required' };
    }

    if (!siblings.length) return { ok: false, error: 'not_found', message: 'ไม่พบสินค้า' };
    const skus = siblings.map(toCatalogItem);
    if (!selectedSkuId || !skus.some((s) => s.tiktok_sku_id === selectedSkuId)) {
      selectedSkuId = pickDefaultSkuItem(siblings)?.tiktok_sku_id || skus[0].tiktok_sku_id;
    }
    const product = skus.find((s) => s.tiktok_sku_id === selectedSkuId) || skus[0];
    const listingId = siblings[0].tiktok_product_id;
    const related = groupSkusIntoListings(
      PRODUCTS.filter((p) => p.tiktok_product_id && p.tiktok_product_id !== listingId),
      'newest',
    ).slice(0, 10);

    const sampleDescription =
      'นาฬิกา CASIO สินค้าแท้ รับประกันศูนย์ 1 ปี\n\n' +
      '• กันน้ำตามสเปกรุ่น\n' +
      '• วัสดุเรซินทนทาน\n' +
      '• เหมาะสำหรับใส่ทุกวัน';

    const listingCover =
      String(siblings[0].listing_image_url || '').trim() ||
      String(siblings[0].image_url || '').trim() ||
      null;

    return {
      ok: true,
      listing: {
        tiktok_product_id: listingId || null,
        product_name: siblings[0].product_name,
        description: siblings.length > 1 ? sampleDescription : null,
        listing_image_url: listingCover,
      },
      selected_sku_id: selectedSkuId,
      skus,
      product,
      related,
    };
  },

  async getProductDescription({ tiktok_product_id } = {}) {
    await delay();
    const productId = String(tiktok_product_id || '').trim();
    if (!productId) {
      return { ok: false, error: 'validation_failed', message: 'tiktok_product_id required' };
    }
    const description =
      'ขนาดตัวเรือน (ก x ย x ส)34.5 × 26.4 × 8.1 mm น้ำหนัก23 g วัสดุตัวเรือนและกรอบอะลูมิเนียm สายสายเรซิn กันน้ำกันน้ำลึก 50 เมตร';
    return {
      ok: true,
      tiktok_product_id: productId,
      description,
      specs: parseDescriptionSpecs(description),
      cached: true,
    };
  },

  async adminSyncDescriptions({ batch_size, backfill_parsed_specs } = {}) {
    await delay(200);
    if (backfill_parsed_specs) {
      return { ok: true, updated: 0, remaining_estimate: 0 };
    }
    return {
      ok: true,
      synced: Math.min(Number(batch_size) || 25, 25),
      skipped: 0,
      failed: 0,
      remaining_estimate: 0,
    };
  },

  async quoteOrder(params) {
    return mockApi.validateCart(params);
  },

  async applyPromoCode({ code, user_id } = {}) {
    await delay();
    const codes = readPromoCodes();
    const normalized = String(code || '').trim().toUpperCase();
    const promo = codes.find(
      (p) =>
        (p.public_code && p.public_code.toUpperCase() === normalized) ||
        (p.internal_code && p.internal_code.toUpperCase() === normalized),
    );
    if (!promo) return { ok: false, error: 'not_found', message: 'ไม่พบโค้ดส่วนลดนี้' };
    if (!promo.is_active) return { ok: false, error: 'expired', message: 'โค้ดนี้หมดอายุหรือใช้ครบแล้ว' };
    if (promo.distribution === 'targeted' && user_id) {
      const grants = readPromoGrants();
      if (!grants.some((g) => g.promo_code_id === promo.id && g.user_id === user_id && !g.revoked_at)) {
        writePromoGrants([
          ...grants,
          { id: crypto.randomUUID(), promo_code_id: promo.id, user_id, granted_at: new Date().toISOString(), revoked_at: null },
        ]);
      }
    }
    return {
      ok: true,
      promo: { ...promo, source: 'code' },
      message: 'ใช้โค้ดส่วนลดสำเร็จ',
    };
  },

  async validateCart({ items = [], payment_method, user_id } = {}) {
    await delay();
    const issues = [];
    const resolved = [];
    for (const line of items) {
      const product = findProduct(line.tiktok_sku_id);
      if (!product) {
        issues.push({
          tiktok_sku_id: line.tiktok_sku_id,
          type: 'unavailable',
          message: 'สินค้านี้ไม่พร้อมจำหน่ายแล้ว',
        });
        continue;
      }
      if (product.stock_available < line.quantity) {
        issues.push({
          tiktok_sku_id: line.tiktok_sku_id,
          type: 'stock_insufficient',
          stock_available: product.stock_available,
          message: `คงเหลือ ${product.stock_available} ชิ้น`,
        });
      }
      if (line.expected_unit_price != null && line.expected_unit_price !== product.unit_price) {
        issues.push({
          tiktok_sku_id: line.tiktok_sku_id,
          type: 'price_changed',
          expected_unit_price: line.expected_unit_price,
          current_unit_price: product.unit_price,
          message: 'ราคาเปลี่ยนแปลง กรุณายืนยันราคาใหม่',
        });
      }
      resolved.push({
        tiktok_sku_id: product.tiktok_sku_id,
        quantity: line.quantity,
        unit_price: product.unit_price,
        line_total: product.unit_price * line.quantity,
        stock_available: product.stock_available,
        product_name: product.product_name,
        sku_name: product.sku_name,
        image_url: product.image_url,
      });
    }
    const subtotal = resolved.reduce((s, i) => s + i.line_total, 0);
    const { shipping_fee: baseShipping } = getMockShippingInfo();
    const promoTotals = computeOrderPromoTotals(
      subtotal,
      baseShipping,
      payment_method,
      user_id
    );
    const price_changed = issues.some((i) => i.type === 'price_changed');
    const stock_insufficient = issues.some(
      (i) => i.type === 'stock_insufficient' || i.type === 'unavailable'
    );
    return {
      ok: true,
      valid: issues.length === 0,
      items: resolved,
      subtotal,
      shipping_fee: promoTotals.shippingFee,
      discount: promoTotals.discount,
      grand_total: promoTotals.grandTotal,
      promo_breakdown: promoTotals.breakdown,
      breakdown: promoTotals.breakdown,
      applied_promo_ids: promoTotals.appliedPromoIds,
      discounted_subtotal: promoTotals.discountedSubtotal,
      price_changed,
      stock_insufficient,
      ...(issues.length ? { issues } : {}),
    };
  },

  async placeOrder(payload) {
    await delay(500);
    const items = payload.items || [];
    const customerUserId = payload.user_id ?? null;
    const isGuestOrder = !customerUserId;
    // Server is source of truth — recompute from mock catalog (never trust client prices).
    let subtotal = 0;
    for (const line of items) {
      const product = findProduct(line.tiktok_sku_id);
      if (!product) return { ok: false, error: 'validation_failed', message: 'สินค้าไม่ถูกต้อง' };
      if (product.stock_available < line.quantity) {
        return { ok: false, error: 'stock_insufficient', message: 'สินค้าบางรายการมีไม่พอ' };
      }
      subtotal += product.unit_price * line.quantity;
    }
    const { shipping_fee: baseShipping } = getMockShippingInfo();
    const promoTotals = computeOrderPromoTotals(
      subtotal,
      baseShipping,
      payload.payment_method,
      payload.user_id
    );
    const grand_total = promoTotals.grandTotal;
    incrementPromoUsage(promoTotals.appliedPromoIds);
    const orderId = ++orderSeq;
    const now = new Date();
    const ymd = now.toISOString().slice(0, 10).replace(/-/g, '');
    const web_order_number = `WEB-${ymd}-${String(orderId).slice(-4)}`;

    const guestToken = isGuestOrder ? crypto.randomUUID() : null;

    const stored = {
      order_id: orderId,
      web_order_number,
      status: 'pending',
      status_label: 'รอยืนยัน',
      sale_date: now.toISOString(),
      grand_total,
      payment_method: payload.payment_method,
      customer_user_id: customerUserId,
      is_guest: isGuestOrder,
      guest_lookup_token: guestToken,
      shipping: {
        recipient_name: payload.shipping?.recipient_name,
        phone: payload.shipping?.phone,
        address: [
          payload.shipping?.address_line,
          payload.shipping?.subdistrict,
          payload.shipping?.district,
          payload.shipping?.province,
          payload.shipping?.postal_code,
        ]
          .filter(Boolean)
          .join(' '),
      },
      items: items.map((line) => {
        const p = findProduct(line.tiktok_sku_id);
        return {
          product_name: p.product_name,
          sku_name: p.sku_name,
          quantity: line.quantity,
          unit_price: p.unit_price,
          image_url: p.image_url,
        };
      }),
    };
    const all = readOrders();
    all.unshift(stored);
    writeOrders(all);

    return {
      ok: true,
      order_id: orderId,
      web_order_number,
      status: 'pending',
      status_label: 'รอยืนยัน',
      grand_total,
      payment_method: payload.payment_method,
      guest_lookup_token: isGuestOrder ? guestToken : undefined,
      message: 'สั่งซื้อสำเร็จ ร้านจะยืนยันออเดอร์และแจ้งเมื่อจัดส่ง',
    };
  },

  async getMyOrders({ page = 1, page_size = 20, user_id } = {}) {
    await delay();
    let uid = user_id;
    if (!uid) {
      try {
        const raw = localStorage.getItem('times_shop_mock_user');
        uid = raw ? JSON.parse(raw)?.id : null;
      } catch {
        uid = null;
      }
    }
    let all = readOrders();
    if (uid) {
      all = all.filter((o) => o.customer_user_id === uid);
    } else {
      all = [];
    }
    const start = (page - 1) * page_size;
    return { ok: true, orders: all.slice(start, start + page_size), total: all.length };
  },

  async getOrder({ order_id }) {
    await delay();
    const all = readOrders();
    const order = all.find((o) => String(o.order_id) === String(order_id));
    if (!order) return { ok: false, error: 'not_found', message: 'ไม่พบออเดอร์' };
    return { ok: true, order };
  },

  async getPaymentInfo() {
    await delay();
    const { shipping_fee, shipping_label } = getMockShippingInfo();
    const announcement = getPublicAnnouncement();
    const profile_image_url = readClientProfileImageUrl();
    const cover_image_url = readClientCoverImageUrl();
    let units_sold_display = null;
    try {
      const raw = localStorage.getItem('times_shop_units_sold_display');
      if (raw != null && raw !== '') units_sold_display = Number(raw);
    } catch {
      /* ignore */
    }
    // MVP: bank accounts may be empty until admin configures them.
    return {
      ok: true,
      shipping_fee,
      shipping_label,
      bank_accounts: [
        {
          id: 'mock-bank-1',
          bank_name: 'กสิกรไทย',
          account_number: 'xxx-x-x1234-x',
          account_name: 'TIMES STORE',
        },
      ],
      announcement,
      store: {
        profile_image_url,
        cover_image_url,
        units_sold_display,
        name: 'TIMES STORE',
      },
    };
  },

  async uploadSlip(file, { user_id } = {}) {
    await delay(400);
    const ext = (file?.name?.split('.').pop() || 'jpg').toLowerCase();
    const id = crypto.randomUUID();
    const folder = user_id || 'guest';
    return {
      ok: true,
      storage_path: `payment-slips/${folder}/${id}.${ext}`,
      upload_id: id,
    };
  },

  async verifySlip({ storage_path } = {}) {
    await delay();
    if (!storage_path) return { ok: false, error: 'invalid_file' };
    // No OCR — files always go to manual admin review.
    return {
      ok: true,
      status: 'pending_review',
      message: 'อัปโหลดสลิปสำเร็จ — รอเจ้าหน้าที่ตรวจสอบ',
    };
  },

  async listAddresses() {
    await delay();
    return { ok: true, addresses: readAddrs() };
  },

  async upsertAddress(payload) {
    await delay();
    let addrs = readAddrs();
    if (payload.is_default) addrs = addrs.map((a) => ({ ...a, is_default: false }));
    let saved;
    if (payload.id) {
      addrs = addrs.map((a) => (a.id === payload.id ? { ...a, ...payload } : a));
      saved = addrs.find((a) => a.id === payload.id);
    } else {
      saved = { ...payload, id: crypto.randomUUID() };
      addrs.push(saved);
    }
    writeAddrs(addrs);
    return { ok: true, address: saved };
  },

  async deleteAddress({ id }) {
    await delay();
    writeAddrs(readAddrs().filter((a) => a.id !== id));
    return { ok: true };
  },

  async adminGetShopSettings() {
    await delay();
    const { shipping_fee, shipping_label } = getMockShippingInfo();
    let units_sold_display = null;
    try {
      const raw = localStorage.getItem('times_shop_units_sold_display');
      if (raw != null && raw !== '') units_sold_display = Number(raw);
    } catch {
      /* ignore */
    }
    return {
      ok: true,
      shipping_fee,
      shipping_label,
      profile_image_url: readClientProfileImageUrl(),
      cover_image_url: readClientCoverImageUrl(),
      units_sold_display,
    };
  },

  async adminUpdateShopSettings({ shipping_fee, profile_image_url, cover_image_url, units_sold_display } = {}) {
    await delay();
    if (shipping_fee != null) {
      if (!Number.isFinite(Number(shipping_fee)) || Number(shipping_fee) < 0) {
        return { ok: false, error: 'validation_failed', message: 'กรุณากรอกค่าจัดส่งที่ถูกต้อง' };
      }
      writeClientShippingFee(shipping_fee);
    }
    if (profile_image_url !== undefined) {
      const trimmed = profile_image_url == null ? '' : String(profile_image_url).trim();
      if (trimmed) {
        try {
          const parsed = new URL(trimmed);
          if (!['http:', 'https:'].includes(parsed.protocol)) {
            return { ok: false, error: 'validation_failed', message: 'URL รูปโปรไฟล์ต้องขึ้นต้นด้วย http หรือ https' };
          }
        } catch {
          return { ok: false, error: 'validation_failed', message: 'URL รูปโปรไฟล์ไม่ถูกต้อง' };
        }
        writeClientProfileImageUrl(trimmed);
      } else {
        writeClientProfileImageUrl(null);
      }
    }
    if (cover_image_url !== undefined) {
      const trimmed = cover_image_url == null ? '' : String(cover_image_url).trim();
      if (trimmed) {
        try {
          const parsed = new URL(trimmed);
          if (!['http:', 'https:'].includes(parsed.protocol)) {
            return { ok: false, error: 'validation_failed', message: 'URL รูป cover ต้องขึ้นต้นด้วย http หรือ https' };
          }
        } catch {
          return { ok: false, error: 'validation_failed', message: 'URL รูป cover ไม่ถูกต้อง' };
        }
        writeClientCoverImageUrl(trimmed);
      } else {
        writeClientCoverImageUrl(null);
      }
    }
    if (units_sold_display !== undefined) {
      if (units_sold_display == null || units_sold_display === '') {
        localStorage.removeItem('times_shop_units_sold_display');
      } else {
        const n = Number(units_sold_display);
        if (!Number.isFinite(n) || n < 0) {
          return { ok: false, error: 'validation_failed', message: 'ยอดขายที่แสดงต้องเป็นตัวเลข 0 ขึ้นไป' };
        }
        localStorage.setItem('times_shop_units_sold_display', String(Math.floor(n)));
      }
    }
    const info = getMockShippingInfo();
    let savedUnits = null;
    try {
      const raw = localStorage.getItem('times_shop_units_sold_display');
      if (raw != null && raw !== '') savedUnits = Number(raw);
    } catch {
      /* ignore */
    }
    return {
      ok: true,
      ...info,
      profile_image_url: readClientProfileImageUrl(),
      cover_image_url: readClientCoverImageUrl(),
      units_sold_display: savedUnits,
    };
  },

  async adminGetAnnouncement() {
    await delay();
    const { enabled, items } = getMockAnnouncementState();
    return { ok: true, enabled, items };
  },

  async adminSaveAnnouncement(payload) {
    await delay();
    try {
      const state = saveMockAnnouncement(payload);
      return { ok: true, enabled: state.enabled, items: state.items };
    } catch (err) {
      return {
        ok: false,
        error: 'validation_failed',
        message: err instanceof Error ? err.message : 'ข้อมูลไม่ถูกต้อง',
      };
    }
  },

  async getHomepageConfig() {
    await delay();
    return { ok: true, blocks: getPublicHomepageBlocks() };
  },

  async trackProductView(payload) {
    await delay();
    try {
      trackMockProductView(payload);
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: 'validation_failed',
        message: err instanceof Error ? err.message : 'ข้อมูลไม่ถูกต้อง',
      };
    }
  },

  async adminGetHomepage() {
    await delay();
    return { ok: true, blocks: getMockHomepageBlocks() };
  },

  async adminSaveHomepage(payload) {
    await delay();
    try {
      const blocks = (payload.blocks ?? []).map((block, index) => validateMockHomepageBlock(block, index));
      saveMockHomepageBlocks(blocks);
      return { ok: true, blocks };
    } catch (err) {
      return {
        ok: false,
        error: 'validation_failed',
        message: err instanceof Error ? err.message : 'ข้อมูลไม่ถูกต้อง',
      };
    }
  },

  async getActivePromos({ user_id } = {}) {
    await delay();
    return { ok: true, promos: getActivePromosForUser(user_id || null) };
  },

  async getMyPromos({ user_id } = {}) {
    await delay();
    if (!user_id) return { ok: true, promos: [] };
    return { ok: true, promos: getWalletPromosForUser(user_id) };
  },

  async adminPromoList() {
    await delay();
    return adminListPromos();
  },

  async adminPromoUpsert(payload) {
    await delay();
    return adminUpsertPromo(payload);
  },

  async adminPromoDistribute(payload) {
    await delay();
    return adminDistributePromo(payload);
  },

  async adminPromoRevoke(payload) {
    await delay();
    return adminRevokePromo(payload);
  },

  async adminListCustomers() {
    await delay();
    return adminListCustomers();
  },

  async adminSlipsQueue() {
    await delay();
    const all = readOrders().filter(
      (o) => o.payment_method === 'transfer' && o.payment_slip_status === 'pending_review',
    );
    return {
      ok: true,
      total: all.length,
      orders: all.map((o) => ({
        order_id: o.order_id,
        web_order_number: o.web_order_number,
        status: o.status,
        sale_date: o.sale_date,
        grand_total: o.grand_total,
        payment_method: o.payment_method,
        payment_slip_path: o.payment_slip_path || null,
        payment_slip_status: o.payment_slip_status || 'pending_review',
        recipient_name: o.shipping?.recipient_name,
        phone: o.shipping?.phone,
        slip_signed_url: null,
      })),
    };
  },

  async adminSlipReview({ order_id, action, note }) {
    await delay();
    const all = readOrders();
    const idx = all.findIndex((o) => String(o.order_id) === String(order_id));
    if (idx < 0) return { ok: false, error: 'not_found', message: 'ไม่พบออเดอร์' };
    const next = action === 'approve' ? 'approved' : 'rejected';
    all[idx] = {
      ...all[idx],
      payment_slip_status: next,
      payment_slip_note: note || null,
    };
    writeOrders(all);
    return { ok: true, message: action === 'approve' ? 'อนุมัติสลิปแล้ว' : 'ปฏิเสธสลิปแล้ว' };
  },

  async listWishlist() {
    await delay();
    try {
      const raw = localStorage.getItem('times_shop_mock_wishlist');
      return { ok: true, items: raw ? JSON.parse(raw) : [] };
    } catch {
      return { ok: true, items: [] };
    }
  },

  async addWishlist(payload) {
    await delay();
    const items = (await mockApi.listWishlist()).items || [];
    const item = { ...payload, id: crypto.randomUUID(), created_at: new Date().toISOString() };
    const next = [...items.filter((i) => i.tiktok_sku_id !== payload.tiktok_sku_id), item];
    localStorage.setItem('times_shop_mock_wishlist', JSON.stringify(next));
    return { ok: true, item };
  },

  async removeWishlist({ tiktok_sku_id }) {
    await delay();
    const items = (await mockApi.listWishlist()).items || [];
    localStorage.setItem(
      'times_shop_mock_wishlist',
      JSON.stringify(items.filter((i) => i.tiktok_sku_id !== tiktok_sku_id)),
    );
    return { ok: true };
  },

  async cancelOrder({ order_id }) {
    await delay();
    const all = readOrders();
    const idx = all.findIndex((o) => String(o.order_id) === String(order_id));
    if (idx < 0) return { ok: false, error: 'not_found', message: 'ไม่พบออเดอร์' };
    if (all[idx].status !== 'pending') {
      return { ok: false, error: 'invalid_state', message: 'ออเดอร์นี้ยกเลิกไม่ได้แล้ว' };
    }
    all[idx] = { ...all[idx], status: 'voided', status_label: 'ยกเลิก' };
    writeOrders(all);
    return { ok: true, message: 'ยกเลิกออเดอร์แล้ว', status: 'voided', promos_restored: false };
  },

  async guestOrderTrack({ token, web_order_number, phone } = {}) {
    await delay();
    const all = readOrders();
    if (token) {
      const order = all.find((o) => o.guest_lookup_token === token);
      if (!order) return { ok: false, error: 'not_found', message: 'ไม่พบออเดอร์' };
      return { ok: true, order };
    }
    const needle = String(web_order_number || '').trim().toLowerCase();
    const last4 = String(phone || '').replace(/\D/g, '').slice(-4);
    if (!needle || last4.length !== 4) {
      return { ok: false, error: 'validation_failed', message: 'กรุณากรอกเลขออเดอร์และเบอร์โทร 4 หลักท้าย' };
    }
    const order = all.find(
      (o) =>
        String(o.web_order_number || '').toLowerCase() === needle &&
        String(o.shipping?.phone || '').replace(/\D/g, '').slice(-4) === last4
    );
    if (!order) return { ok: false, error: 'not_found', message: 'ไม่พบออเดอร์หรือข้อมูลไม่ตรงกัน' };
    return { ok: true, order };
  },

  async adminDashboard() {
    await delay();
    const all = readOrders();
    const pending = all.filter((o) => o.status === 'pending').length;
    const active = all.filter((o) => o.status === 'active').length;
    const revenue = all.filter((o) => o.status !== 'voided').reduce((s, o) => s + (o.grand_total || 0), 0);
    const slipsPending = all.filter((o) => o.payment_method === 'transfer' && o.payment_slip_status === 'pending_review').length;
    return {
      ok: true,
      stats: { orders_30d: all.length, pending_orders: pending, active_orders: active, revenue_30d: revenue, slips_pending: slipsPending },
    };
  },

  async adminBankList() {
    await delay();
    try {
      const raw = localStorage.getItem('times_shop_mock_banks');
      return { ok: true, accounts: raw ? JSON.parse(raw) : [] };
    } catch {
      return { ok: true, accounts: [] };
    }
  },

  async adminBankUpsert(payload) {
    await delay();
    const res = await mockApi.adminBankList();
    let accounts = res.accounts || [];
    const row = {
      id: payload.id || crypto.randomUUID(),
      bank_name: payload.bank_name,
      account_number: payload.account_number,
      account_name: payload.account_name,
      is_active: payload.is_active !== false,
    };
    if (payload.id) accounts = accounts.map((a) => (a.id === payload.id ? row : a));
    else accounts.push(row);
    localStorage.setItem('times_shop_mock_banks', JSON.stringify(accounts));
    return { ok: true, account: row };
  },

  async adminBankDelete({ id }) {
    await delay();
    const res = await mockApi.adminBankList();
    localStorage.setItem('times_shop_mock_banks', JSON.stringify((res.accounts || []).filter((a) => a.id !== id)));
    return { ok: true };
  },

  async adminProductsList({ q = '', page = 1, page_size = 50 } = {}) {
    await delay();
    let list = ENRICHED_PRODUCTS.map(toCatalogItem);
    if (q) {
      const needle = q.toLowerCase();
      list = list.filter(
        (p) =>
          p.product_name.toLowerCase().includes(needle) ||
          (p.sku_name || '').toLowerCase().includes(needle),
      );
    }
    const start = (page - 1) * page_size;
    return { ok: true, items: list.slice(start, start + page_size), total: list.length, page, page_size };
  },

  async adminProductUpdate({ tiktok_sku_id, is_published, soft_delete }) {
    await delay();
    const p = PRODUCTS.find((x) => x.tiktok_sku_id === tiktok_sku_id);
    if (!p) return { ok: false, error: 'not_found', message: 'ไม่พบ SKU' };
    if (is_published != null) p.is_published = is_published;
    if (soft_delete) p.deleted_at = new Date().toISOString();
    return { ok: true, product: { tiktok_sku_id, is_published: p.is_published, deleted_at: p.deleted_at } };
  },
};
