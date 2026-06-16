import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createServiceClient } from '../_shared/auth.ts';
import { handleOptions, jsonResponse } from '../_shared/http.ts';

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  const db = createServiceClient();
  const { data: settings, error: sErr } = await db.from('shop_settings').select('*').eq('id', 1).single();
  if (sErr) return jsonResponse({ ok: false, error: 'db_error', message: sErr.message });

  const { data: banks } = await db
    .from('shop_bank_accounts')
    .select('id, bank_name, account_number, account_name')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  return jsonResponse({
    ok: true,
    shipping_fee: Number(settings.shipping_fee),
    shipping_label: settings.shipping_label,
    bank_accounts: banks ?? [],
  });
});
