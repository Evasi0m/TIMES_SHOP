import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createServiceClient, getUser, requireAuth } from '../_shared/auth.ts';
import { handleOptions, jsonResponse, readJson } from '../_shared/http.ts';
import { isPromoActive, toClientPromo, type PromoRow } from '../_shared/promo.ts';

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  const user = await getUser(req);
  const denied = requireAuth(user);
  if (denied) return jsonResponse(denied);

  const body = await readJson<{ user_id?: string }>(req);
  const userId = body.user_id ?? user!.id;

  const db = createServiceClient();
  const { data: grants, error: gErr } = await db
    .from('promo_grants')
    .select('granted_at, revoked_at, promo_code_id')
    .eq('user_id', userId)
    .is('revoked_at', null);
  if (gErr) return jsonResponse({ ok: false, error: 'db_error', message: gErr.message });

  const { data: codes, error: cErr } = await db.from('promo_codes').select('*');
  if (cErr) return jsonResponse({ ok: false, error: 'db_error', message: cErr.message });

  const promos = (grants ?? [])
    .map((g) => {
      const promo = (codes as PromoRow[]).find((c) => c.id === g.promo_code_id);
      if (!promo) return null;
      return {
        ...toClientPromo(promo, 'targeted'),
        granted_at: g.granted_at,
        status: isPromoActive(promo) ? 'active' : 'expired',
      };
    })
    .filter(Boolean);

  return jsonResponse({ ok: true, promos });
});
