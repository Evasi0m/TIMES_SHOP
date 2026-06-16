import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createServiceClient, getUser, requireAuth } from '../_shared/auth.ts';
import { handleOptions, jsonResponse, readJson } from '../_shared/http.ts';

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  const user = await getUser(req);
  const denied = requireAuth(user);
  if (denied) return jsonResponse(denied);

  const payload = await readJson<Record<string, unknown>>(req);
  const db = createServiceClient();
  const userId = user!.id;

  if (payload.is_default) {
    await db.from('customer_addresses').update({ is_default: false }).eq('user_id', userId);
  }

  const row = {
    user_id: userId,
    label: (payload.label as string | null) ?? null,
    recipient_name: String(payload.recipient_name ?? ''),
    phone: String(payload.phone ?? ''),
    address_line: String(payload.address_line ?? ''),
    subdistrict: (payload.subdistrict as string | null) ?? null,
    district: (payload.district as string | null) ?? null,
    province: String(payload.province ?? ''),
    postal_code: String(payload.postal_code ?? ''),
    is_default: Boolean(payload.is_default),
  };

  if (!row.recipient_name || !row.phone || !row.address_line || !row.province || !row.postal_code) {
    return jsonResponse({ ok: false, error: 'validation_failed', message: 'กรุณากรอกที่อยู่ให้ครบ' });
  }

  if (payload.id) {
    const { data, error } = await db
      .from('customer_addresses')
      .update(row)
      .eq('id', payload.id)
      .eq('user_id', userId)
      .select('*')
      .single();
    if (error || !data) {
      return jsonResponse({ ok: false, error: 'not_found', message: 'ไม่พบที่อยู่' });
    }
    return jsonResponse({ ok: true, address: data });
  }

  const { data, error } = await db.from('customer_addresses').insert(row).select('*').single();
  if (error) return jsonResponse({ ok: false, error: 'db_error', message: error.message });
  return jsonResponse({ ok: true, address: data });
});
