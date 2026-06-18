/** Convert TikTok internal image URI to HTTPS (SG seller CDN). */
function tiktokUriToHttps(uri: string): string | undefined {
  const trimmed = uri.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (!trimmed || trimmed.startsWith('data:')) return undefined;
  return `https://p16-oec-sg.ibyteimg.com/${trimmed}~tplv-aphluv4xwc-origin-jpeg.jpeg`;
}

/** Minimal image URL picker for description arrays. */
function pickFirstUrl(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (typeof value === 'string') {
    const s = value.trim();
    if (/^https?:\/\//i.test(s)) return s;
    return tiktokUriToHttps(s);
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const u = pickFirstUrl(item);
      if (u) return u;
    }
    return undefined;
  }
  if (typeof value === 'object') {
    const o = value as Record<string, unknown>;
    return pickFirstUrl(o.url)
      || pickFirstUrl(o.urls)
      || pickFirstUrl(o.url_list)
      || pickFirstUrl(o.thumb_url)
      || pickFirstUrl(o.image_url)
      || pickFirstUrl(o.uri);
  }
  return undefined;
}

/** Unwrap product detail payload (API shapes vary by version). */
export function unwrapProductDetail(data: Record<string, unknown>): Record<string, unknown> {
  const productDetail = data?.product_detail;
  if (productDetail && typeof productDetail === 'object' && !Array.isArray(productDetail)) {
    const pd = productDetail as Record<string, unknown>;
    const nested = pd.product;
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
      return nested as Record<string, unknown>;
    }
    return pd;
  }
  const nested = data?.product;
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    return nested as Record<string, unknown>;
  }
  return data;
}

function collectImageUrls(value: unknown, out: string[] = []): string[] {
  if (value == null) return out;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    const url = /^https?:\/\//i.test(trimmed) ? trimmed : tiktokUriToHttps(trimmed);
    if (url) out.push(url);
    return out;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectImageUrls(item, out);
    return out;
  }
  if (typeof value === 'object') {
    const url = pickFirstUrl(value);
    if (url) out.push(url);
  }
  return out;
}

function imagesToHtml(urls: string[]): string {
  return [...new Set(urls)]
    .map((url, i) => `<img src="${url}" alt="คำอธิบาย ${i + 1}" />`)
    .join('\n');
}

function parseDescDetailBlocks(blocks: unknown): string | null {
  if (!Array.isArray(blocks)) return null;
  const parts: string[] = [];

  for (const block of blocks) {
    if (!block || typeof block !== 'object') continue;
    const row = block as Record<string, unknown>;
    const type = String(row.type || '').toLowerCase();

    if (type === 'text') {
      const text = String(row.text ?? '').trim();
      if (text) parts.push(text);
      continue;
    }

    if (type === 'ul' && Array.isArray(row.content)) {
      for (const item of row.content) {
        const line = String(item ?? '').trim();
        if (line) parts.push(`• ${line}`);
      }
      continue;
    }

    if (type === 'image') {
      const image = row.image;
      const url = pickFirstUrl(image);
      if (url) parts.push(`<img src="${url}" alt="คำอธิบาย" />`);
    }
  }

  return parts.length ? parts.join('\n\n') : null;
}

function extractDescDetail(data: Record<string, unknown>): string | null {
  const raw = data.desc_detail;
  if (Array.isArray(raw)) return parseDescDetailBlocks(raw);
  if (typeof raw !== 'string') return null;

  const text = raw.trim();
  if (!text) return null;
  if (text.startsWith('[')) {
    try {
      return parseDescDetailBlocks(JSON.parse(text));
    } catch {
      return text;
    }
  }
  return text;
}

function descriptionFromImages(data: Record<string, unknown>): string | null {
  const imageFields = [
    'description',
    'description_images',
    'desc_images',
    'desc_image',
    'product_description',
  ];
  const urls: string[] = [];
  for (const key of imageFields) {
    collectImageUrls(data[key], urls);
  }
  if (!urls.length) return null;
  return imagesToHtml(urls);
}

function parseStructuredJsonString(text: string): string | null {
  if (!text.startsWith('[') && !text.startsWith('{')) return null;
  try {
    const parsed = JSON.parse(text);
    const fromBlocks = parseDescDetailBlocks(parsed);
    if (fromBlocks) return fromBlocks;
    const urls = collectImageUrls(parsed);
    if (urls.length) return imagesToHtml(urls);
  } catch {
    /* not JSON */
  }
  return null;
}

/** Extract description HTML/text from TikTok product detail payload. */
export function extractDescriptionFromProduct(data: Record<string, unknown>): string | null {
  const fromDescDetail = extractDescDetail(data);
  if (fromDescDetail) return fromDescDetail;

  const info = data.description_info;
  if (info && typeof info === 'object' && !Array.isArray(info)) {
    const infoObj = info as Record<string, unknown>;
    const nested = extractDescriptionFromProduct(infoObj);
    if (nested) return nested;
    const fromInfoImages = descriptionFromImages(infoObj);
    if (fromInfoImages) return fromInfoImages;
  }

  if (Array.isArray(data.description)) {
    const fromBlocks = parseDescDetailBlocks(data.description);
    if (fromBlocks) return fromBlocks;
    const fromImages = descriptionFromImages({ description: data.description });
    if (fromImages) return fromImages;
  }

  const textFields = [
    data.description,
    data.product_description,
    data.description_html,
    data.desc,
    (data.description_info as Record<string, unknown> | undefined)?.description,
  ];

  for (const value of textFields) {
    if (typeof value !== 'string') continue;
    const text = value.trim();
    if (!text) continue;

    const structured = parseStructuredJsonString(text);
    if (structured) return structured;

    return text;
  }

  return descriptionFromImages(data);
}
