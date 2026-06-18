import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createServiceClient } from '../_shared/auth.ts';
import { sanitizeViewSnapshot } from '../_shared/homepage.ts';
import { handleOptions, jsonResponse, readJson } from '../_shared/http.ts';

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  const body = await readJson<{ tiktok_product_id?: string; snapshot?: Record<string, unknown> }>(req);
  const productId = String(body.tiktok_product_id ?? '').trim();
  if (!productId) {
    return jsonResponse({ ok: false, error: 'validation_failed', message: 'กรุณาระบุ tiktok_product_id' });
  }

  const snapshot = sanitizeViewSnapshot(body.snapshot);
  if (!snapshot.product_name) {
    return jsonResponse({ ok: false, error: 'validation_failed', message: 'snapshot ไม่ครบ' });
  }

  const db = createServiceClient();
  const { error } = await db.rpc('increment_product_view', {
    p_id: productId,
    p_snapshot: snapshot,
  });
  if (error) return jsonResponse({ ok: false, error: 'db_error', message: error.message });

  return jsonResponse({ ok: true });
});
