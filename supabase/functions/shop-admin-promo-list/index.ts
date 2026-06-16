import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createServiceClient, getUser, requireAdmin } from '../_shared/auth.ts';
import { getPromoStatus } from '../_shared/promo.ts';
import { handleOptions, jsonResponse } from '../_shared/http.ts';

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  const user = await getUser(req);
  const denied = requireAdmin(user);
  if (denied) return jsonResponse(denied);

  const db = createServiceClient();
  const { data: codes, error } = await db.from('promo_codes').select('*').order('updated_at', { ascending: false });
  if (error) return jsonResponse({ ok: false, error: 'db_error', message: error.message });

  const { data: grants } = await db.from('promo_grants').select('promo_code_id, revoked_at');
  const enriched = (codes ?? []).map((p) => ({
    ...p,
    discount_value: Number(p.discount_value),
    min_order: Number(p.min_order ?? 0),
    grant_count: (grants ?? []).filter((g) => g.promo_code_id === p.id && !g.revoked_at).length,
    status: getPromoStatus(p),
  }));

  return jsonResponse({ ok: true, promos: enriched });
});
