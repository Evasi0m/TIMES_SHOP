import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createServiceClient, getUser, requireAuth } from '../_shared/auth.ts';
import { handleOptions, jsonResponse, readJson } from '../_shared/http.ts';

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  const user = await getUser(req);
  const denied = requireAuth(user);
  if (denied) return jsonResponse(denied);

  const body = await readJson<Record<string, unknown>>(req);
  const skuId = String(body.tiktok_sku_id || '');
  if (!skuId) {
    return jsonResponse({ ok: false, error: 'validation_failed', message: 'ไม่พบ SKU' });
  }

  const db = createServiceClient();
  const row = {
    id: crypto.randomUUID(),
    user_id: user!.id,
    tiktok_sku_id: skuId,
    tiktok_product_id: body.tiktok_product_id ? String(body.tiktok_product_id) : null,
    product_name: body.product_name ? String(body.product_name) : null,
    sku_name: body.sku_name ? String(body.sku_name) : null,
    image_url: body.image_url ? String(body.image_url) : null,
    unit_price: body.unit_price != null ? Number(body.unit_price) : null,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await db
    .from('customer_wishlist')
    .upsert(row, { onConflict: 'user_id,tiktok_sku_id' })
    .select('*')
    .single();

  if (error) return jsonResponse({ ok: false, error: 'db_error', message: error.message });
  return jsonResponse({ ok: true, item: data });
});
