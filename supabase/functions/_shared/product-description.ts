import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { fetchTikTokProductDescription, isTikTokConfigured } from './tiktok-client.ts';

export function normalizeDescription(raw: string): string {
  let text = String(raw ?? '').trim();
  if (!text) return '';

  const hasHtml = /<[^>]+>/.test(text);
  if (hasHtml && /<img[\s>]/i.test(text)) {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  text = text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");

  return text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+\n/g, '\n')
    .trim();
}

export function extractDescriptionFromProduct(data: Record<string, unknown>): string | null {
  const candidates = [
    data.description,
    data.product_description,
    data.description_html,
    data.desc,
  ];
  for (const value of candidates) {
    const normalized = normalizeDescription(String(value ?? ''));
    if (normalized) return normalized;
  }
  return null;
}

export async function getCachedDescription(
  db: SupabaseClient,
  productId: string,
): Promise<string | null> {
  const { data, error } = await db
    .from('shop_product_descriptions')
    .select('description')
    .eq('tiktok_product_id', productId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const text = normalizeDescription(String(data?.description ?? ''));
  return text || null;
}

/** Insert once — never overwrite existing rows. */
export async function insertDescriptionIfMissing(
  db: SupabaseClient,
  productId: string,
  description: string,
): Promise<boolean> {
  const text = normalizeDescription(description);
  if (!text) return false;

  const { error } = await db
    .from('shop_product_descriptions')
    .insert({
      tiktok_product_id: productId,
      description: text,
      fetched_at: new Date().toISOString(),
    });

  if (error) {
    if (error.code === '23505') return false;
    throw new Error(error.message);
  }
  return true;
}

export async function resolveProductDescription(
  db: SupabaseClient,
  productId: string,
): Promise<{ description: string | null; cached: boolean }> {
  const cached = await getCachedDescription(db, productId);
  if (cached) return { description: cached, cached: true };

  if (!await isTikTokConfigured()) {
    return { description: null, cached: false };
  }

  const raw = await fetchTikTokProductDescription(productId);
  if (!raw) return { description: null, cached: false };

  await insertDescriptionIfMissing(db, productId, raw);
  const stored = (await getCachedDescription(db, productId)) ?? normalizeDescription(raw);
  return { description: stored || null, cached: false };
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
