import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createServiceClient, getUser, requireAdmin } from '../_shared/auth.ts';
import { handleOptions, jsonResponse, readJson } from '../_shared/http.ts';

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  const user = await getUser(req);
  const denied = requireAdmin(user);
  if (denied) return jsonResponse(denied);

  const { promo_id, mode, user_ids = [], emails = [] } = await readJson<{
    promo_id?: string;
    mode?: string;
    user_ids?: string[];
    emails?: string[];
  }>(req);

  if (!promo_id) {
    return jsonResponse({ ok: false, error: 'validation_failed', message: 'ไม่พบ promo_id' });
  }

  const db = createServiceClient();
  const { data: promo, error: pErr } = await db.from('promo_codes').select('*').eq('id', promo_id).single();
  if (pErr || !promo) {
    return jsonResponse({ ok: false, error: 'not_found', message: 'ไม่พบโปร' });
  }

  const now = new Date().toISOString();

  if (mode === 'broadcast') {
    const { data: updated, error } = await db
      .from('promo_codes')
      .update({ distribution: 'broadcast', is_active: true, updated_at: now })
      .eq('id', promo_id)
      .select('*')
      .single();
    if (error) return jsonResponse({ ok: false, error: 'db_error', message: error.message });
    return jsonResponse({
      ok: true,
      promo: updated,
      message: 'แจกโปรทั้งร้านแล้ว — ลูกค้าและ guest เห็นราคาหลังลดทันที',
    });
  }

  if (mode === 'targeted') {
    await db
      .from('promo_codes')
      .update({ distribution: 'targeted', is_active: true, updated_at: now })
      .eq('id', promo_id);

    const ids = new Set(user_ids);

    for (const email of emails) {
      const normalized = String(email).trim().toLowerCase();
      if (!normalized) continue;
      const { data: users } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const match = users.users.find((u) => u.email?.toLowerCase() === normalized);
      if (match) ids.add(match.id);
    }

    let granted = 0;
    for (const userId of ids) {
      const { error } = await db.from('promo_grants').upsert(
        {
          id: crypto.randomUUID(),
          promo_code_id: promo_id,
          user_id: userId,
          granted_at: now,
          revoked_at: null,
        },
        { onConflict: 'promo_code_id,user_id', ignoreDuplicates: false },
      );
      if (!error) granted += 1;
    }

    const { data: updated } = await db.from('promo_codes').select('*').eq('id', promo_id).single();
    return jsonResponse({
      ok: true,
      promo: updated,
      granted_count: granted,
      message: `แจกโปรให้ลูกค้า ${granted} คนแล้ว`,
    });
  }

  return jsonResponse({ ok: false, error: 'validation_failed', message: 'โหมดแจกไม่ถูกต้อง' });
});
