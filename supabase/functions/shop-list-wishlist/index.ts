import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createServiceClient, getUser, requireAuth } from '../_shared/auth.ts';
import { handleOptions, jsonResponse } from '../_shared/http.ts';

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  const user = await getUser(req);
  const denied = requireAuth(user);
  if (denied) return jsonResponse(denied);

  const db = createServiceClient();
  const { data, error } = await db
    .from('customer_wishlist')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false });

  if (error) return jsonResponse({ ok: false, error: 'db_error', message: error.message });
  return jsonResponse({ ok: true, items: data || [] });
});
