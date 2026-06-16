import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createServiceClient, getUser, requireAdmin } from '../_shared/auth.ts';
import { handleOptions, jsonResponse, readJson } from '../_shared/http.ts';

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  const user = await getUser(req);
  const denied = requireAdmin(user);
  if (denied) return jsonResponse(denied);

  const body = await readJson<Record<string, unknown>>(req);
  const bankName = String(body.bank_name || '').trim();
  const accountNumber = String(body.account_number || '').trim();
  const accountName = String(body.account_name || '').trim();
  if (!bankName || !accountNumber || !accountName) {
    return jsonResponse({ ok: false, error: 'validation_failed', message: 'กรุณากรอกข้อมูลบัญชีให้ครบ' });
  }

  const db = createServiceClient();
  const now = new Date().toISOString();
  const row = {
    bank_name: bankName,
    account_number: accountNumber,
    account_name: accountName,
    is_active: body.is_active !== false,
    sort_order: Number(body.sort_order) || 0,
    updated_at: now,
  };

  if (body.id) {
    const { data, error } = await db
      .from('shop_bank_accounts')
      .update(row)
      .eq('id', body.id)
      .select('*')
      .single();
    if (error) return jsonResponse({ ok: false, error: 'db_error', message: error.message });
    return jsonResponse({ ok: true, account: data });
  }

  const { data, error } = await db
    .from('shop_bank_accounts')
    .insert({ id: crypto.randomUUID(), ...row, created_at: now })
    .select('*')
    .single();
  if (error) return jsonResponse({ ok: false, error: 'db_error', message: error.message });
  return jsonResponse({ ok: true, account: data });
});
