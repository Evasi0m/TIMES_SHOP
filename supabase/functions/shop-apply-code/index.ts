import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createServiceClient, getUser } from '../_shared/auth.ts';
import { handleOptions, jsonResponse, readJson } from '../_shared/http.ts';
import { findPromoByCode, isPromoWithinPerUserLimit } from '../_shared/promo-resolve.ts';
import { isPromoActive, toClientPromo } from '../_shared/promo.ts';

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  const body = await readJson<{ code?: string; user_id?: string | null }>(req);
  const code = String(body.code ?? '').trim();
  if (!code) {
    return jsonResponse({ ok: false, error: 'validation_failed', message: 'กรุณากรอกโค้ดส่วนลด' });
  }

  const user = await getUser(req);
  const userId = body.user_id ?? user?.id ?? null;
  const db = createServiceClient();

  const promo = await findPromoByCode(db, code);
  if (!promo) {
    return jsonResponse({ ok: false, error: 'not_found', message: 'ไม่พบโค้ดส่วนลดนี้' });
  }

  if (!isPromoActive(promo)) {
    const now = Date.now();
    const expired = promo.expires_at && new Date(promo.expires_at).getTime() < now;
    const exhausted = promo.max_uses != null && Number(promo.used_count) >= Number(promo.max_uses);
    if (expired) {
      return jsonResponse({ ok: false, error: 'expired', message: 'โค้ดนี้หมดอายุแล้ว' });
    }
    if (exhausted) {
      return jsonResponse({ ok: false, error: 'exhausted', message: 'โค้ดนี้ถูกใช้ครบจำนวนแล้ว' });
    }
    return jsonResponse({ ok: false, error: 'inactive', message: 'โค้ดนี้ยังไม่เปิดใช้งาน' });
  }

  const withinLimit = await isPromoWithinPerUserLimit(db, promo, userId);
  if (!withinLimit) {
    return jsonResponse({
      ok: false,
      error: 'per_user_limit',
      message: 'คุณใช้โค้ดนี้ครบจำนวนที่กำหนดแล้ว',
    });
  }

  const entryEnabled = (promo as { code_entry_enabled?: boolean }).code_entry_enabled;
  const publicCode = (promo as { public_code?: string | null }).public_code;
  if (!entryEnabled && !publicCode) {
    return jsonResponse({
      ok: false,
      error: 'not_redeemable',
      message: 'โปรนี้ไม่รองรับการกรอกโค้ด',
    });
  }

  if (promo.distribution === 'targeted') {
    if (!userId) {
      return jsonResponse({
        ok: false,
        error: 'unauthorized',
        message: 'กรุณาเข้าสู่ระบบเพื่อใช้โค้ดนี้',
      });
    }
    const now = new Date().toISOString();
    const { error: grantErr } = await db.from('promo_grants').upsert(
      {
        id: crypto.randomUUID(),
        promo_code_id: promo.id,
        user_id: userId,
        granted_at: now,
        revoked_at: null,
      },
      { onConflict: 'promo_code_id,user_id', ignoreDuplicates: false },
    );
    if (grantErr) {
      return jsonResponse({ ok: false, error: 'db_error', message: grantErr.message });
    }
  }

  if (promo.distribution === 'draft') {
    return jsonResponse({ ok: false, error: 'inactive', message: 'โปรนี้ยังไม่เปิดใช้งาน' });
  }

  return jsonResponse({
    ok: true,
    promo: toClientPromo(promo, promo.distribution === 'broadcast' ? 'broadcast' : 'code'),
    message: 'ใช้โค้ดส่วนลดสำเร็จ',
  });
});
