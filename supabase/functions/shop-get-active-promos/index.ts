import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createServiceClient, getUser } from '../_shared/auth.ts';
import { handleOptions, jsonResponse, readJson } from '../_shared/http.ts';
import { isPromoActive, toClientPromo, type PromoRow } from '../_shared/promo.ts';

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  const body = await readJson<{ user_id?: string }>(req);
  const user = await getUser(req);
  const userId = body.user_id ?? user?.id ?? null;

  const db = createServiceClient();
  const { data: codes, error } = await db.from('promo_codes').select('*');
  if (error) return jsonResponse({ ok: false, error: 'db_error', message: error.message });

  const active = (codes as PromoRow[]).filter((p) => isPromoActive(p));
  const result = [];

  for (const promo of active) {
    if (promo.distribution === 'broadcast') {
      result.push(toClientPromo(promo, 'broadcast'));
      continue;
    }
    if (promo.distribution === 'targeted' && userId) {
      const { data: grants } = await db
        .from('promo_grants')
        .select('id')
        .eq('promo_code_id', promo.id)
        .eq('user_id', userId)
        .is('revoked_at', null)
        .limit(1);
      if (grants?.length) result.push(toClientPromo(promo, 'targeted'));
    }
  }

  return jsonResponse({ ok: true, promos: result });
});
