export const BLOCK_KINDS = ['banner', 'product_row', 'coupon_row'] as const;
export const BANNER_LAYOUTS = ['single', 'slide', 'bento', 'row'] as const;
export const BANNER_ASPECTS = ['1:1', '16:9'] as const;
export const PRODUCT_SOURCES = ['best_selling', 'newest', 'popular'] as const;

export const VIEW_SNAPSHOT_FIELDS = [
  'tiktok_product_id',
  'product_name',
  'image_url',
  'listing_image_url',
  'price_min',
  'price_max',
  'price_min_in_stock',
  'default_sku_id',
  'tiktok_sku_id',
  'sku_count',
  'units_sold',
  'in_stock',
  'stock_available',
] as const;

export type BlockKind = (typeof BLOCK_KINDS)[number];
export type BannerLayout = (typeof BANNER_LAYOUTS)[number];
export type BannerAspect = (typeof BANNER_ASPECTS)[number];
export type ProductSource = (typeof PRODUCT_SOURCES)[number];

export type HomepageBlockRow = {
  id: string;
  kind: BlockKind;
  title: string | null;
  config: Record<string, unknown>;
  sort_order: number;
  is_active: boolean;
};

export type HomepageBlockInput = {
  id?: string;
  kind?: string;
  title?: string | null;
  config?: Record<string, unknown>;
  sort_order?: number;
  is_active?: boolean;
};

export const BANNER_LINK_TYPES = ['none', 'product', 'url'] as const;
export type BannerLinkType = (typeof BANNER_LINK_TYPES)[number];

export type BannerImage = {
  image_url: string;
  link_type: BannerLinkType;
  tiktok_product_id?: string | null;
  tiktok_sku_id?: string | null;
  link_url?: string | null;
};

function validateUrl(url: string | null, label: string) {
  if (!url) return { ok: true as const, value: null };
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { ok: false as const, message: `${label}: ลิงก์ต้องขึ้นต้นด้วย http หรือ https` };
    }
    return { ok: true as const, value: url };
  } catch {
    return { ok: false as const, message: `${label}: URL ไม่ถูกต้อง` };
  }
}

function inferBannerLinkType(row: Record<string, unknown>): BannerLinkType {
  const explicit = String(row.link_type ?? '').trim() as BannerLinkType;
  if (BANNER_LINK_TYPES.includes(explicit)) return explicit;
  if (String(row.tiktok_product_id ?? '').trim()) return 'product';
  if (String(row.link_url ?? '').trim()) return 'url';
  return 'none';
}

function validateInternalPath(path: string, label: string) {
  const trimmed = path.trim();
  if (!trimmed.startsWith('/')) {
    return { ok: false as const, message: `${label}: path ต้องขึ้นต้นด้วย /` };
  }
  if (trimmed.startsWith('/catalog') || trimmed.startsWith('/product/')) {
    return { ok: true as const, value: trimmed };
  }
  return { ok: false as const, message: `${label}: path ต้องขึ้นต้นด้วย /catalog หรือ /product/` };
}

function validateProductId(id: string, label: string) {
  const trimmed = id.trim();
  if (!trimmed) {
    return { ok: false as const, message: `${label}: กรุณากรอก TikTok Product ID` };
  }
  if (!/^\d+$/.test(trimmed)) {
    return { ok: false as const, message: `${label}: Product ID ต้องเป็นตัวเลข` };
  }
  return { ok: true as const, value: trimmed };
}

function validateOptionalSkuId(id: unknown, label: string) {
  const trimmed = id == null || id === '' ? '' : String(id).trim();
  if (!trimmed) return { ok: true as const, value: null };
  if (!/^\d+$/.test(trimmed)) {
    return { ok: false as const, message: `${label}: SKU ID ต้องเป็นตัวเลข` };
  }
  return { ok: true as const, value: trimmed };
}

function validateBannerLinkFields(
  row: Record<string, unknown>,
  label: string,
): { ok: true; link: Omit<BannerImage, 'image_url'> } | { ok: false; message: string } {
  const linkType = inferBannerLinkType(row);

  if (linkType === 'none') {
    return { ok: true, link: { link_type: 'none' } };
  }

  if (linkType === 'product') {
    const productCheck = validateProductId(String(row.tiktok_product_id ?? ''), label);
    if (!productCheck.ok) return productCheck;
    const skuCheck = validateOptionalSkuId(row.tiktok_sku_id, label);
    if (!skuCheck.ok) return skuCheck;
    return {
      ok: true,
      link: {
        link_type: 'product',
        tiktok_product_id: productCheck.value,
        tiktok_sku_id: skuCheck.value,
      },
    };
  }

  const linkRaw = row.link_url == null || row.link_url === '' ? null : String(row.link_url).trim();
  if (!linkRaw) {
    return { ok: false as const, message: `${label}: กรุณากรอกลิงก์` };
  }
  if (/^https?:\/\//i.test(linkRaw)) {
    const linkCheck = validateUrl(linkRaw, label);
    if (!linkCheck.ok) return linkCheck;
    return { ok: true, link: { link_type: 'url', link_url: linkCheck.value } };
  }
  const pathCheck = validateInternalPath(linkRaw, label);
  if (!pathCheck.ok) return pathCheck;
  return { ok: true, link: { link_type: 'url', link_url: pathCheck.value } };
}

function validateBannerConfig(config: Record<string, unknown>, index: number) {
  const layout = String(config.layout ?? 'single') as BannerLayout;
  if (!BANNER_LAYOUTS.includes(layout)) {
    return { ok: false as const, message: `บล็อกที่ ${index + 1}: layout ไม่ถูกต้อง` };
  }

  let aspect = String(config.aspect ?? '16:9') as BannerAspect;
  if (layout === 'row') aspect = '1:1';
  if (!BANNER_ASPECTS.includes(aspect)) {
    return { ok: false as const, message: `บล็อกที่ ${index + 1}: aspect ไม่ถูกต้อง` };
  }

  const rawImages = Array.isArray(config.images) ? config.images : [];
  if (!rawImages.length) {
    return { ok: false as const, message: `บล็อกที่ ${index + 1}: กรุณาเพิ่มรูปอย่างน้อย 1 รูป` };
  }
  if (rawImages.length > 8) {
    return { ok: false as const, message: `บล็อกที่ ${index + 1}: รูปได้สูงสุด 8 รูป` };
  }

  const images: BannerImage[] = [];
  for (let i = 0; i < rawImages.length; i++) {
    const row = rawImages[i] as Record<string, unknown>;
    const imageLabel = `บล็อกที่ ${index + 1} รูปที่ ${i + 1}`;
    const imageUrl = String(row.image_url ?? '').trim();
    if (!imageUrl) {
      return { ok: false as const, message: `${imageLabel}: กรุณากรอก URL รูป` };
    }
    const imageCheck = validateUrl(imageUrl, imageLabel);
    if (!imageCheck.ok) return imageCheck;

    const linkCheck = validateBannerLinkFields(row, `${imageLabel} ลิงก์`);
    if (!linkCheck.ok) return linkCheck;

    images.push({ image_url: imageUrl, ...linkCheck.link });
  }

  return { ok: true as const, config: { layout, aspect, images } };
}

function validateProductRowConfig(config: Record<string, unknown>, index: number) {
  const source = String(config.source ?? 'best_selling') as ProductSource;
  if (!PRODUCT_SOURCES.includes(source)) {
    return { ok: false as const, message: `บล็อกที่ ${index + 1}: source ไม่ถูกต้อง` };
  }
  const limit = Math.min(20, Math.max(4, Number(config.limit) || 10));
  return { ok: true as const, config: { source, limit } };
}

export function sanitizeViewSnapshot(input: Record<string, unknown> | null | undefined) {
  const snapshot: Record<string, unknown> = {};
  if (!input || typeof input !== 'object') return snapshot;
  for (const key of VIEW_SNAPSHOT_FIELDS) {
    if (input[key] != null) snapshot[key] = input[key];
  }
  return snapshot;
}

export function validateBlock(block: HomepageBlockInput, index: number) {
  const kind = String(block.kind ?? '') as BlockKind;
  if (!BLOCK_KINDS.includes(kind)) {
    return { ok: false as const, message: `บล็อกที่ ${index + 1}: ประเภทไม่ถูกต้อง` };
  }

  const title = block.title == null || block.title === '' ? null : String(block.title).trim();
  const config = (block.config && typeof block.config === 'object' ? block.config : {}) as Record<
    string,
    unknown
  >;

  if (kind === 'banner') {
    const result = validateBannerConfig(config, index);
    if (!result.ok) return result;
    return {
      ok: true as const,
      id: block.id ? String(block.id) : undefined,
      kind,
      title,
      config: result.config,
      sort_order: Number.isFinite(Number(block.sort_order)) ? Number(block.sort_order) : index,
      is_active: block.is_active !== false,
    };
  }

  if (kind === 'product_row') {
    const result = validateProductRowConfig(config, index);
    if (!result.ok) return result;
    return {
      ok: true as const,
      id: block.id ? String(block.id) : undefined,
      kind,
      title: title || 'สินค้าแนะนำ',
      config: result.config,
      sort_order: Number.isFinite(Number(block.sort_order)) ? Number(block.sort_order) : index,
      is_active: block.is_active !== false,
    };
  }

  return {
    ok: true as const,
    id: block.id ? String(block.id) : undefined,
    kind,
    title: title || 'คูปองส่วนลด',
    config: {},
    sort_order: Number.isFinite(Number(block.sort_order)) ? Number(block.sort_order) : index,
    is_active: block.is_active !== false,
  };
}

export function toClientBlock(row: HomepageBlockRow, items?: unknown[]) {
  const base = {
    id: row.id,
    kind: row.kind,
    title: row.title,
    config: row.config ?? {},
  };
  if (row.kind === 'product_row' && (row.config as { source?: string })?.source === 'popular') {
    return { ...base, items: items ?? [] };
  }
  return base;
}

export function toAdminBlock(row: HomepageBlockRow) {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    config: row.config ?? {},
    sort_order: row.sort_order,
    is_active: row.is_active,
  };
}

export function productSourceCatalogSort(source: ProductSource) {
  if (source === 'best_selling') return 'best_selling';
  if (source === 'newest') return 'newest';
  return null;
}

export function productSourceSeeAllHref(source: ProductSource) {
  if (source === 'best_selling') return '/catalog?sort=best_selling';
  if (source === 'newest') return '/catalog?sort=newest';
  return '/catalog';
}
