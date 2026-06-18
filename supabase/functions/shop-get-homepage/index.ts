import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createServiceClient } from '../_shared/auth.ts';
import { handleOptions, jsonResponse } from '../_shared/http.ts';
import {
  toClientBlock,
  type HomepageBlockRow,
  type ProductSource,
} from '../_shared/homepage.ts';

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  const db = createServiceClient();
  const { data: rows, error } = await db
    .from('shop_homepage_blocks')
    .select('id, kind, title, config, sort_order, is_active')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) return jsonResponse({ ok: false, error: 'db_error', message: error.message });

  const blocks = [];
  for (const row of (rows ?? []) as HomepageBlockRow[]) {
    if (row.kind === 'product_row' && (row.config as { source?: ProductSource })?.source === 'popular') {
      const limit = Math.min(20, Math.max(4, Number((row.config as { limit?: number }).limit) || 10));
      const { data: views, error: vErr } = await db
        .from('shop_product_views')
        .select('snapshot')
        .order('view_count', { ascending: false })
        .limit(limit);
      if (vErr) return jsonResponse({ ok: false, error: 'db_error', message: vErr.message });
      const items = (views ?? []).map((v) => v.snapshot).filter(Boolean);
      blocks.push(toClientBlock(row, items));
      continue;
    }
    blocks.push(toClientBlock(row));
  }

  return jsonResponse({ ok: true, blocks });
});
