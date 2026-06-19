import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { createPosServiceClient } from '../_shared/pos-client.ts';
import {
  getCachedDescription,
  insertDescriptionIfMissing,
  sleep,
} from '../_shared/product-description.ts';
import { fetchTikTokProductDescription, isTikTokConfigured } from '../_shared/tiktok-client.ts';

const DEFAULT_BATCH_SIZE = 25;
const DEFAULT_DELAY_MS = 300;
const CATALOG_PAGE_SIZE = 100;

async function fetchPosCatalogPage(
  posUrl: string,
  posKey: string,
  page: number,
): Promise<{ items: Array<{ tiktok_product_id?: string | null }>; total: number }> {
  const res = await fetch(`${posUrl}/functions/v1/shop-get-catalog`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${posKey}`,
      apikey: posKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      group_by: 'product',
      page,
      page_size: CATALOG_PAGE_SIZE,
      include_items: true,
    }),
  });
  const json = await res.json();
  if (!json?.ok) {
    throw new Error(json?.message || json?.error || 'POS catalog fetch failed');
  }
  return {
    items: (json.items as Array<{ tiktok_product_id?: string | null }>) || [],
    total: Number(json.total) || 0,
  };
}

async function listMissingProductIds(
  db: SupabaseClient,
  posUrl: string,
  posKey: string,
  maxIds: number,
): Promise<string[]> {
  const missing: string[] = [];
  const seen = new Set<string>();
  let page = 1;
  let totalPages = 1;

  while (missing.length < maxIds && page <= totalPages) {
    const { items, total } = await fetchPosCatalogPage(posUrl, posKey, page);
    totalPages = Math.max(1, Math.ceil(total / CATALOG_PAGE_SIZE));

    const productIds = items
      .map((item) => String(item.tiktok_product_id ?? '').trim())
      .filter(Boolean);

    if (productIds.length) {
      const { data: cachedRows } = await db
        .from('shop_product_descriptions')
        .select('tiktok_product_id')
        .in('tiktok_product_id', productIds);

      const cachedSet = new Set(
        (cachedRows || []).map((row: { tiktok_product_id: string }) => row.tiktok_product_id),
      );

      for (const id of productIds) {
        if (seen.has(id) || cachedSet.has(id)) continue;
        seen.add(id);
        missing.push(id);
        if (missing.length >= maxIds) break;
      }
    }

    page += 1;
  }

  return missing;
}

export async function syncDescriptionBatch(
  db: SupabaseClient,
  opts: { batchSize?: number; delayMs?: number } = {},
): Promise<{
  ok: true;
  synced: number;
  skipped: number;
  failed: number;
  remaining_estimate: number | null;
  errors?: Array<{ tiktok_product_id: string; message: string }>;
}> {
  const pos = createPosServiceClient();
  if (!pos) {
    return {
      ok: true,
      synced: 0,
      skipped: 0,
      failed: 0,
      remaining_estimate: null,
      errors: [{ tiktok_product_id: '', message: 'POS bridge not configured' }],
    };
  }

  if (!await isTikTokConfigured()) {
    return {
      ok: true,
      synced: 0,
      skipped: 0,
      failed: 0,
      remaining_estimate: null,
      errors: [{ tiktok_product_id: '', message: 'TikTok not configured (set TIKTOK_APP_KEY/SECRET on Shop, or all four TikTok secrets)' }],
    };
  }

  const posUrl = Deno.env.get('POS_SUPABASE_URL') || 'https://pxenybeudcsddsnkduaj.supabase.co';
  const posKey = Deno.env.get('POS_SERVICE_ROLE_KEY') || '';
  const batchSize = Math.min(Math.max(Number(opts.batchSize) || DEFAULT_BATCH_SIZE, 1), 50);
  const delayMs = Math.min(Math.max(Number(opts.delayMs) || DEFAULT_DELAY_MS, 100), 2000);

  const missingIds = await listMissingProductIds(db, posUrl, posKey, batchSize);
  let synced = 0;
  let skipped = 0;
  let failed = 0;
  const errors: Array<{ tiktok_product_id: string; message: string }> = [];

  for (const productId of missingIds) {
    const existing = await getCachedDescription(db, productId);
    if (existing) {
      skipped += 1;
      continue;
    }

    try {
      const raw = await fetchTikTokProductDescription(productId);
      if (!raw) {
        skipped += 1;
        continue;
      }
      const inserted = await insertDescriptionIfMissing(db, productId, raw);
      if (inserted) synced += 1;
      else skipped += 1;
    } catch (e) {
      failed += 1;
      errors.push({
        tiktok_product_id: productId,
        message: e instanceof Error ? e.message : 'fetch failed',
      });
    }

    if (delayMs > 0) await sleep(delayMs);
  }

  const { count } = await db
    .from('shop_product_descriptions')
    .select('*', { count: 'exact', head: true });

  const firstPage = await fetchPosCatalogPage(posUrl, posKey, 1);
  const catalogTotal = firstPage.total;
  const remainingEstimate = catalogTotal > 0
    ? Math.max(0, catalogTotal - (count ?? 0))
    : null;

  return {
    ok: true,
    synced,
    skipped,
    failed,
    remaining_estimate: remainingEstimate,
    ...(errors.length ? { errors } : {}),
  };
}
