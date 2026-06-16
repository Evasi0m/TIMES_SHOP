import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createServiceClient, getUser, requireAdmin } from '../_shared/auth.ts';
import { handleOptions, jsonResponse, readJson } from '../_shared/http.ts';

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  const user = await getUser(req);
  const denied = requireAdmin(user);
  if (denied) return jsonResponse(denied);

  const { shipping_fee, shipping_label } = await readJson<{
    shipping_fee?: number;
    shipping_label?: string;
  }>(req);

  if (shipping_fee == null || !Number.isFinite(Number(shipping_fee)) || Number(shipping_fee) < 0) {
    return jsonResponse({ ok: false, error: 'validation_failed', message: 'กรุณากรอกค่าจัดส่งที่ถูกต้อง' });
  }

  const db = createServiceClient();
  const patch: Record<string, unknown> = {
    shipping_fee: Number(shipping_fee),
    updated_at: new Date().toISOString(),
  };
  if (shipping_label != null) patch.shipping_label = String(shipping_label);

  const { data, error } = await db
    .from('shop_settings')
    .update(patch)
    .eq('id', 1)
    .select('shipping_fee, shipping_label')
    .single();
  if (error) return jsonResponse({ ok: false, error: 'db_error', message: error.message });

  return jsonResponse({
    ok: true,
    shipping_fee: Number(data.shipping_fee),
    shipping_label: data.shipping_label,
  });
});
