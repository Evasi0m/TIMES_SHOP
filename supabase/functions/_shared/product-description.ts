import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { fetchTikTokProductDescription, isTikTokConfigured } from './tiktok-client.ts';
import {
  formatSpecLineBreaks,
  parseDescriptionSpecs,
  type ParsedSpec,
} from './product-description-format.ts';

export type { ParsedSpec };

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

  text = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+\n/g, '\n')
    .trim();

  return formatSpecLineBreaks(text);
}

export function buildParsedSpecs(raw: string): ParsedSpec[] {
  const normalized = normalizeDescription(raw);
  if (!normalized || (/<img[\s>]/i.test(normalized))) return [];
  return parseDescriptionSpecs(normalized);
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
  const row = await getCachedProductDescription(db, productId);
  return row.description;
}

export async function getCachedProductDescription(
  db: SupabaseClient,
  productId: string,
): Promise<{ description: string | null; specs: ParsedSpec[]; cached: boolean }> {
  const { data, error } = await db
    .from('shop_product_descriptions')
    .select('description, parsed_specs')
    .eq('tiktok_product_id', productId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data?.description) {
    return { description: null, specs: [], cached: false };
  }

  const description = normalizeDescription(String(data.description));
  const stored = Array.isArray(data.parsed_specs) ? data.parsed_specs as ParsedSpec[] : [];
  const specs = stored.length
    ? stored
    : buildParsedSpecs(String(data.description));

  return {
    description: description || null,
    specs,
    cached: true,
  };
}

/** Insert once — never overwrite existing rows. */
export async function insertDescriptionIfMissing(
  db: SupabaseClient,
  productId: string,
  description: string,
): Promise<boolean> {
  const text = normalizeDescription(description);
  if (!text) return false;
  const specs = buildParsedSpecs(description);

  const { error } = await db
    .from('shop_product_descriptions')
    .insert({
      tiktok_product_id: productId,
      description: text,
      parsed_specs: specs.length ? specs : null,
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
): Promise<{ description: string | null; specs: ParsedSpec[]; cached: boolean }> {
  const cached = await getCachedProductDescription(db, productId);
  if (cached.description) return cached;

  if (!await isTikTokConfigured()) {
    return { description: null, specs: [], cached: false };
  }

  const raw = await fetchTikTokProductDescription(productId);
  if (!raw) return { description: null, specs: [], cached: false };

  await insertDescriptionIfMissing(db, productId, raw);
  const stored = await getCachedProductDescription(db, productId);
  if (stored.description) return { ...stored, cached: false };

  const description = normalizeDescription(raw);
  return {
    description: description || null,
    specs: buildParsedSpecs(raw),
    cached: false,
  };
}

/** Backfill parsed_specs for rows cached before parser existed. */
export async function backfillParsedSpecsBatch(
  db: SupabaseClient,
  batchSize = 50,
): Promise<{ ok: true; updated: number; remaining_estimate: number | null }> {
  const limit = Math.min(Math.max(batchSize, 1), 100);
  const { data: rows, error } = await db
    .from('shop_product_descriptions')
    .select('tiktok_product_id, description')
    .is('parsed_specs', null)
    .limit(limit);
  if (error) throw new Error(error.message);

  let updated = 0;
  for (const row of rows || []) {
    const productId = String(row.tiktok_product_id ?? '').trim();
    if (!productId) continue;
    const specs = buildParsedSpecs(String(row.description ?? ''));
    const { error: updateError } = await db
      .from('shop_product_descriptions')
      .update({
        parsed_specs: specs.length ? specs : [],
        description: normalizeDescription(String(row.description ?? '')),
      })
      .eq('tiktok_product_id', productId);
    if (!updateError) updated += 1;
  }

  const { count } = await db
    .from('shop_product_descriptions')
    .select('*', { count: 'exact', head: true })
    .is('parsed_specs', null);

  return {
    ok: true,
    updated,
    remaining_estimate: count ?? null,
  };
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
