import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createServiceClient, getUser, requireAdmin } from '../_shared/auth.ts';
import { generateInternalCode } from '../_shared/promo.ts';
import { handleOptions, jsonResponse, readJson } from '../_shared/http.ts';

const PROMO_TYPES = new Set(['product_discount', 'free_shipping', 'cod_discount', 'special_discount']);

function validatePromoPayload(payload: Record<string, unknown>) {
  const type = String(payload.promo_type ?? '');
  if (!PROMO_TYPES.has(type)) {
    return { ok: false as const, message: 'ประเภทโปรไม่ถูกต้อง' };
  }
  if (!String(payload.display_name ?? '').trim()) {
    return { ok: false as const, message: 'กรุณากรอกชื่อที่ลูกค้าเห็น' };
  }

  const codeEntryEnabled = Boolean(payload.code_entry_enabled);
  const publicCodeRaw = payload.public_code != null ? String(payload.public_code).trim() : '';
  if (codeEntryEnabled && !publicCodeRaw) {
    return { ok: false as const, message: 'เปิดกรอกโค้ดต้องระบุโค้ดสาธารณะ' };
  }

  if (type === 'free_shipping') {
    const mode = payload.discount_mode;
    const value = Number(payload.discount_value) || 0;
    if (mode != null && String(mode).trim() !== '') {
      return { ok: false as const, message: 'โปรส่งฟรีไม่ต้องระบุรูปแบบส่วนลด' };
    }
    if (value !== 0) {
      return { ok: false as const, message: 'โปรส่งฟรีต้องตั้งมูลค่าส่วนลดเป็น 0' };
    }
  } else {
    const value = Number(payload.discount_value) || 0;
    if (value <= 0) {
      return { ok: false as const, message: 'กรุณาระบุมูลค่าส่วนลดมากกว่า 0' };
    }
    const mode = String(payload.discount_mode ?? '');
    if (mode === 'percent' && (value <= 0 || value > 100)) {
      return { ok: false as const, message: 'ส่วนลดเปอร์เซ็นต์ต้องอยู่ระหว่าง 1–100' };
    }
  }

  if (payload.max_uses_per_user != null && payload.max_uses_per_user !== '') {
    const perUser = Number(payload.max_uses_per_user);
    if (!Number.isFinite(perUser) || perUser < 1) {
      return { ok: false as const, message: 'จำกัดต่อลูกค้าต้องเป็นจำนวนเต็มอย่างน้อย 1' };
    }
  }

  return { ok: true as const };
}

function isDuplicateCodeError(error: { code?: string; message?: string }) {
  return error.code === '23505' || /unique|duplicate/i.test(error.message ?? '');
}

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  const user = await getUser(req);
  const denied = requireAdmin(user);
  if (denied) return jsonResponse(denied);

  const payload = await readJson<Record<string, unknown>>(req);
  const validation = validatePromoPayload(payload);
  if (!validation.ok) {
    return jsonResponse({ ok: false, error: 'validation_failed', message: validation.message });
  }

  const db = createServiceClient();
  const now = new Date().toISOString();
  const type = String(payload.promo_type ?? '');

  const publicCode = payload.public_code != null && String(payload.public_code).trim()
    ? String(payload.public_code).trim().toUpperCase()
    : null;

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
    max_uses_per_user:
      payload.max_uses_per_user != null && payload.max_uses_per_user !== ''
        ? Number(payload.max_uses_per_user)
        : null,
    is_active: payload.is_active !== false,
    distribution: String(payload.distribution ?? 'draft'),
    public_code: publicCode,
    code_entry_enabled: Boolean(payload.code_entry_enabled),
    updated_at: now,
  };

  if (payload.id) {
    const { data, error } = await db
      .from('promo_codes')
      .update(base)
      .eq('id', payload.id)
      .select('*')
      .single();
    if (error) {
      if (isDuplicateCodeError(error)) {
        return jsonResponse({
          ok: false,
          error: 'duplicate_code',
          message: 'โค้ดสาธารณะนี้ถูกใช้แล้ว กรุณาใช้โค้ดอื่น',
        });
      }
      return jsonResponse({ ok: false, error: 'db_error', message: error.message });
    }
    if (!data) {
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
  if (error) {
    if (isDuplicateCodeError(error)) {
      return jsonResponse({
        ok: false,
        error: 'duplicate_code',
        message: 'โค้ดสาธารณะนี้ถูกใช้แล้ว กรุณาใช้โค้ดอื่น',
      });
    }
    return jsonResponse({ ok: false, error: 'db_error', message: error.message });
  }
  return jsonResponse({ ok: true, promo: data });
});
