import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createServiceClient, getUser, requireAdmin } from '../_shared/auth.ts';
import { handleOptions, jsonResponse } from '../_shared/http.ts';

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  const user = await getUser(req);
  const denied = requireAdmin(user);
  if (denied) return jsonResponse(denied);

  const db = createServiceClient();
  const { data, error } = await db
    .from('shop_settings')
    .select('shipping_fee, shipping_label, profile_image_url, cover_image_url, units_sold_display')
    .eq('id', 1)
    .single();
  if (error) return jsonResponse({ ok: false, error: 'db_error', message: error.message });
  return jsonResponse({
    ok: true,
    shipping_fee: Number(data.shipping_fee),
    shipping_label: data.shipping_label,
    profile_image_url: data.profile_image_url ? String(data.profile_image_url).trim() : null,
    cover_image_url: data.cover_image_url ? String(data.cover_image_url).trim() : null,
    units_sold_display:
      data.units_sold_display != null ? Number(data.units_sold_display) : null,
  });
});
