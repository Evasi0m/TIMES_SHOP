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
  const { data: profiles, error: pErr } = await db
    .from('customer_profiles')
    .select('user_id, display_name, phone');
  if (pErr) return jsonResponse({ ok: false, error: 'db_error', message: pErr.message });

  const { data: authData, error: aErr } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (aErr) return jsonResponse({ ok: false, error: 'db_error', message: aErr.message });

  const customers = authData.users
    .filter((u) => {
      const role = (u.app_metadata?.app_role as string) ?? '';
      return role === 'customer' || role === '';
    })
    .map((u) => {
      const profile = (profiles ?? []).find((p) => p.user_id === u.id);
      return {
        id: u.id,
        email: u.email,
        display_name: profile?.display_name ?? u.user_metadata?.display_name ?? u.email,
        phone: profile?.phone ?? null,
      };
    });

  return jsonResponse({ ok: true, customers });
});
