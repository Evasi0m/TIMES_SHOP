import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createServiceClient, getUser, requireAdmin } from '../_shared/auth.ts';
import { generateInternalCode } from '../_shared/promo.ts';
import { handleOptions, jsonResponse, readJson } from '../_shared/http.ts';

const PROMO_TYPES = new Set(['product_discount', 'free_shipping', 'cod_discount', 'special_discount']);

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  const user = await getUser(req);
  const denied = requireAdmin(user);
  if (denied) return jsonResponse(denied);

  const payload = await readJson<Record<string, unknown>>(req);
  const db = createServiceClient();
  const now = new Date().toISOString();
  const type = String(payload.promo_type ?? '');

  if (!PROMO_TYPES.has(type)) {
    return jsonResponse({ ok: false, error: 'validation_failed', message: 'ประเภทโปรไม่ถูกต้อง' });
  }
  if (!String(payload.display_name ?? '').trim()) {
    return jsonResponse({ ok: false, error: 'validation_failed', message: 'กรุณากรอกชื่อที่ลูกค้าเห็น' });
  }

  const base = {
    display_name: String(payload.display_name).trim(),
    promo_type: type,
    discount_mode: type === 'free_shipping' ? null : (payload.discount_mode as string | null) ?? null,
    discount_value: type === 'free_shipping' ? 0 : Number(payload.discount_value) || 0,
    min_order: Number(payload.min_order) || 0,
    starts_at: (payload.starts_at as string | null) ?? null,
    expires_at: payload.no_expiry ? null : ((payload.expires_at as string | null) ?? null),
    max_uses:
      payload.max_uses != null && payload.max_uses !== '' ? Number(payload.max_uses) : null,
    is_active: payload.is_active !== false,
    distribution: String(payload.distribution ?? 'draft'),
    updated_at: now,
  };

  if (payload.id) {
    const { data, error } = await db
      .from('promo_codes')
      .update(base)
      .eq('id', payload.id)
      .select('*')
      .single();
    if (error || !data) {
      return jsonResponse({ ok: false, error: 'not_found', message: 'ไม่พบโปร' });
    }
    return jsonResponse({ ok: true, promo: data });
  }

  const promo = {
    id: crypto.randomUUID(),
    internal_code: String(payload.internal_code ?? '').trim() || generateInternalCode(),
    used_count: 0,
    created_at: now,
    ...base,
  };

  const { data, error } = await db.from('promo_codes').insert(promo).select('*').single();
  if (error) return jsonResponse({ ok: false, error: 'db_error', message: error.message });
  return jsonResponse({ ok: true, promo: data });
});
