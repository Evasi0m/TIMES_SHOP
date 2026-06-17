/** Minimal image URL picker for description arrays. */
function pickFirstUrl(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (typeof value === 'string') {
    const s = value.trim();
    return /^https?:\/\//i.test(s) ? s : undefined;
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
      || pickFirstUrl(o.uri)
      || pickFirstUrl(o.urls)
      || pickFirstUrl(o.url_list)
      || pickFirstUrl(o.thumb_url)
      || pickFirstUrl(o.image_url);
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
    if (/^https?:\/\//i.test(trimmed)) out.push(trimmed);
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
  const unique = [...new Set(urls)];
  if (!unique.length) return null;
  return unique.map((url, i) => `<img src="${url}" alt="คำอธิบาย ${i + 1}" />`).join('\n');
}

/** Extract description HTML/text from TikTok product detail payload. */
export function extractDescriptionFromProduct(data: Record<string, unknown>): string | null {
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
    if (text.startsWith('[') || text.startsWith('{')) {
      try {
        const parsed = JSON.parse(text);
        const urls = collectImageUrls(parsed);
        if (urls.length) {
          return [...new Set(urls)]
            .map((url, i) => `<img src="${url}" alt="คำอธิบาย ${i + 1}" />`)
            .join('\n');
        }
      } catch {
        /* not JSON — use raw string */
      }
    }
    return text;
  }

  return descriptionFromImages(data);
}
