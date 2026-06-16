import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createServiceClient, getUser, requireAdmin } from '../_shared/auth.ts';
import { handleOptions, jsonResponse, readJson } from '../_shared/http.ts';

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  const user = await getUser(req);
  const denied = requireAdmin(user);
  if (denied) return jsonResponse(denied);

  const { promo_id, user_id } = await readJson<{ promo_id?: string; user_id?: string }>(req);
  if (!promo_id) {
    return jsonResponse({ ok: false, error: 'validation_failed', message: 'ไม่พบ promo_id' });
  }

  const db = createServiceClient();
  const now = new Date().toISOString();

  if (user_id) {
    const { error } = await db
      .from('promo_grants')
      .update({ revoked_at: now })
      .eq('promo_code_id', promo_id)
      .eq('user_id', user_id)
      .is('revoked_at', null);
    if (error) return jsonResponse({ ok: false, error: 'db_error', message: error.message });
    return jsonResponse({ ok: true, message: 'ถอนสิทธิ์ลูกค้าแล้ว' });
  }

  const { error } = await db
    .from('promo_codes')
    .update({ is_active: false, updated_at: now })
    .eq('id', promo_id);
  if (error) return jsonResponse({ ok: false, error: 'db_error', message: error.message });
  return jsonResponse({ ok: true, message: 'ปิดใช้งานโปรแล้ว' });
});
