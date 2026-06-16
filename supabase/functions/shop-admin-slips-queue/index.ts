import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createServiceClient, getUser, requireAdmin } from '../_shared/auth.ts';
import { handleOptions, jsonResponse } from '../_shared/http.ts';
import { createPosServiceClient, posNotConfiguredResponse } from '../_shared/pos-client.ts';
import { slipObjectKey } from '../_shared/web-orders.ts';

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  const user = await getUser(req);
  const denied = requireAdmin(user);
  if (denied) return jsonResponse(denied);

  const pos = createPosServiceClient();
  if (!pos) return jsonResponse(posNotConfiguredResponse());

  const { data, error } = await pos
    .from('sale_orders')
    .select(`
      id, web_order_number, status, sale_date, grand_total, payment_method,
      payment_slip_path, payment_slip_status, payment_slip_note,
      shipping_recipient_name, shipping_phone, buyer_name
    `)
    .eq('channel', 'web')
    .eq('payment_method', 'transfer')
    .eq('payment_slip_status', 'pending_review')
    .order('sale_date', { ascending: false })
    .limit(100);

  if (error) return jsonResponse({ ok: false, error: 'db_error', message: error.message });

  const shopDb = createServiceClient();
  const orders = await Promise.all((data ?? []).map(async (row) => {
    let slip_signed_url: string | null = null;
    const path = row.payment_slip_path ? String(row.payment_slip_path) : '';
    const objectKey = path ? slipObjectKey(path) : null;
    if (objectKey) {
      const { data: signed } = await shopDb.storage
        .from('payment-slips')
        .createSignedUrl(objectKey, 3600);
      slip_signed_url = signed?.signedUrl ?? null;
    }
    return {
      order_id: row.id,
      web_order_number: row.web_order_number,
      status: row.status,
      sale_date: row.sale_date,
      grand_total: Number(row.grand_total),
      payment_method: row.payment_method,
      payment_slip_path: row.payment_slip_path,
      payment_slip_status: row.payment_slip_status,
      payment_slip_note: row.payment_slip_note,
      recipient_name: row.shipping_recipient_name || row.buyer_name,
      phone: row.shipping_phone,
      slip_signed_url,
    };
  }));

  return jsonResponse({ ok: true, orders, total: orders.length });
});
