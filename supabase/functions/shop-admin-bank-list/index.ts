import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createServiceClient, getUser, requireAdmin } from '../_shared/auth.ts';
import { handleOptions, jsonResponse, readJson } from '../_shared/http.ts';

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  const user = await getUser(req);
  const denied = requireAdmin(user);
  if (denied) return jsonResponse(denied);

  const db = createServiceClient();
  const { data, error } = await db
    .from('shop_bank_accounts')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) return jsonResponse({ ok: false, error: 'db_error', message: error.message });
  return jsonResponse({ ok: true, accounts: data || [] });
});
