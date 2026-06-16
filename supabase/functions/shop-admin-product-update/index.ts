import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { getUser, requireAdmin } from '../_shared/auth.ts';
import { handleOptions, jsonResponse, readJson } from '../_shared/http.ts';

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  const user = await getUser(req);
  const denied = requireAdmin(user);
  if (denied) return jsonResponse(denied);

  const posUrl = Deno.env.get('POS_SUPABASE_URL') || '';
  const posKey = Deno.env.get('POS_SERVICE_ROLE_KEY') || '';
  if (!posKey) {
    return jsonResponse({ ok: false, error: 'bridge_not_configured', message: 'POS not configured' });
  }

  const body = await readJson<Record<string, unknown>>(req);
  const res = await fetch(`${posUrl}/functions/v1/shop-admin-product-update`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${posKey}`,
      apikey: posKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return jsonResponse(await res.json());
});
