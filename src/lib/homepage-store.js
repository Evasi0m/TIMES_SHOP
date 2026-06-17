import { validateBannerImageForSave } from './homepage.js';

const STORAGE_KEY = 'times_shop_homepage_blocks';
const VIEWS_KEY = 'times_shop_product_views';

export const DEFAULT_HOMEPAGE_BLOCKS = [
  {
    id: 'mock-home-banner',
    kind: 'banner',
    title: 'รุ่นใหม่! มิถุนายน 2569',
    config: {
      layout: 'slide',
      aspect: '16:9',
      images: [
        {
          image_url: 'https://picsum.photos/seed/home-banner-1/1200/675',
          link_type: 'product',
          tiktok_product_id: '1734098765432109802',
          tiktok_sku_id: '1734123456789012302',
        },
        {
          image_url: 'https://picsum.photos/seed/home-banner-2/1200/675',
          link_type: 'url',
          link_url: '/catalog?sort=newest',
        },
      ],
    },
    sort_order: 0,
    is_active: true,
  },
  {
    id: 'mock-home-coupons',
    kind: 'coupon_row',
    title: 'คูปองส่วนลด',
    config: {},
    sort_order: 1,
    is_active: true,
  },
  {
    id: 'mock-home-best',
    kind: 'product_row',
    title: 'สินค้าขายดี',
    config: { source: 'best_selling', limit: 10 },
    sort_order: 2,
    is_active: true,
  },
  {
    id: 'mock-home-new',
    kind: 'product_row',
    title: 'สินค้ามาใหม่',
    config: { source: 'newest', limit: 10 },
    sort_order: 3,
    is_active: true,
  },
  {
    id: 'mock-home-popular',
    kind: 'product_row',
    title: 'สินค้ายอดนิยม',
    config: { source: 'popular', limit: 10 },
    sort_order: 4,
    is_active: true,
  },
];

function readBlocks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_HOMEPAGE_BLOCKS.map((b) => ({ ...b, config: { ...b.config } }));
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_HOMEPAGE_BLOCKS.map((b) => ({ ...b, config: { ...b.config } }));
  } catch {
    return DEFAULT_HOMEPAGE_BLOCKS.map((b) => ({ ...b, config: { ...b.config } }));
  }
}

function writeBlocks(blocks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(blocks));
}

function readViews() {
  try {
    const raw = localStorage.getItem(VIEWS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeViews(views) {
  localStorage.setItem(VIEWS_KEY, JSON.stringify(views));
}

export function getMockHomepageBlocks() {
  return readBlocks();
}

export function getPublicHomepageBlocks() {
  return readBlocks()
    .filter((b) => b.is_active !== false)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((block) => {
      if (block.kind === 'product_row' && block.config?.source === 'popular') {
        const limit = Math.min(20, Math.max(4, Number(block.config.limit) || 10));
        const views = Object.values(readViews())
          .sort((a, b) => (b.view_count ?? 0) - (a.view_count ?? 0))
          .slice(0, limit)
          .map((v) => v.snapshot)
          .filter(Boolean);
        return { id: block.id, kind: block.kind, title: block.title, config: block.config, items: views };
      }
      return { id: block.id, kind: block.kind, title: block.title, config: block.config };
    });
}

export function saveMockHomepageBlocks(blocks) {
  writeBlocks(blocks);
  return blocks;
}

export function trackMockProductView({ tiktok_product_id, snapshot }) {
  if (!tiktok_product_id || !snapshot?.product_name) {
    throw new Error('snapshot ไม่ครบ');
  }
  const views = readViews();
  const prev = views[tiktok_product_id] ?? { view_count: 0, snapshot: {} };
  views[tiktok_product_id] = {
    view_count: (prev.view_count ?? 0) + 1,
    snapshot,
    last_viewed_at: new Date().toISOString(),
  };
  writeViews(views);
  return { ok: true };
}

export function validateMockHomepageBlock(block, index) {
  const kind = block.kind;
  if (!['banner', 'product_row', 'coupon_row'].includes(kind)) {
    throw new Error(`บล็อกที่ ${index + 1}: ประเภทไม่ถูกต้อง`);
  }
  if (kind === 'banner') {
    const images = Array.isArray(block.config?.images) ? block.config.images : [];
    if (!images.length) throw new Error(`บล็อกที่ ${index + 1}: กรุณาเพิ่มรูปอย่างน้อย 1 รูป`);
    const sanitizedImages = images.map((img, i) =>
      validateBannerImageForSave(img, `บล็อกที่ ${index + 1} รูปที่ ${i + 1}`),
    );
    return {
      id: block.id || crypto.randomUUID(),
      kind,
      title: block.title ?? null,
      config: { ...block.config, images: sanitizedImages },
      sort_order: Number.isFinite(Number(block.sort_order)) ? Number(block.sort_order) : index,
      is_active: block.is_active !== false,
    };
  }
  if (kind === 'product_row') {
    const source = block.config?.source;
    if (!['best_selling', 'newest', 'popular'].includes(source)) {
      throw new Error(`บล็อกที่ ${index + 1}: source ไม่ถูกต้อง`);
    }
  }
  return {
    id: block.id || crypto.randomUUID(),
    kind,
    title: block.title ?? null,
    config: block.config ?? {},
    sort_order: Number.isFinite(Number(block.sort_order)) ? Number(block.sort_order) : index,
    is_active: block.is_active !== false,
  };
}
