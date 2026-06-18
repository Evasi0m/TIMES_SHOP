import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createServiceClient, getUser, requireAuth } from '../_shared/auth.ts';
import { createPosServiceClient, posNotConfiguredResponse } from '../_shared/pos-client.ts';
import { handleOptions, jsonResponse, readJson } from '../_shared/http.ts';

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  const user = await getUser(req);
  const denied = requireAuth(user);
  if (denied) return jsonResponse(denied);

  const body = await readJson<{ order_id?: number | string }>(req);
  const orderId = Number(body.order_id);
  if (!orderId) {
    return jsonResponse({ ok: false, error: 'validation_failed', message: 'ไม่พบออเดอร์' });
  }

  const pos = createPosServiceClient();
  if (!pos) return jsonResponse(posNotConfiguredResponse());

  const { data: order, error } = await pos
    .from('sale_orders')
    .select('id, status, channel, customer_user_id')
    .eq('id', orderId)
    .maybeSingle();

  if (error) return jsonResponse({ ok: false, error: 'db_error', message: error.message });
  if (!order || order.channel !== 'web') {
    return jsonResponse({ ok: false, error: 'not_found', message: 'ไม่พบออเดอร์' });
  }
  if (order.customer_user_id !== user!.id) {
    return jsonResponse({ ok: false, error: 'forbidden', message: 'ไม่มีสิทธิ์ยกเลิกออเดอร์นี้' });
  }
  if (order.status !== 'pending') {
    return jsonResponse({ ok: false, error: 'invalid_state', message: 'ออเดอร์นี้ยกเลิกไม่ได้แล้ว' });
  }

  const { error: updErr } = await pos
    .from('sale_orders')
    .update({ status: 'voided', updated_at: new Date().toISOString() })
    .eq('id', orderId);

  if (updErr) return jsonResponse({ ok: false, error: 'db_error', message: updErr.message });

  const shopDb = createServiceClient();
  const { data: redemptions } = await shopDb
    .from('promo_redemptions')
    .select('id')
    .eq('order_id', orderId)
    .is('reversed_at', null)
    .limit(1);

  const hadPromos = (redemptions?.length ?? 0) > 0;
  if (hadPromos) {
    const { error: decErr } = await shopDb.rpc('decrement_promo_usage', { p_order_id: orderId });
    if (decErr) console.error('decrement_promo_usage failed:', decErr.message);
  }

  return jsonResponse({
    ok: true,
    message: 'ยกเลิกออเดอร์แล้ว',
    status: 'voided',
    promos_restored: hadPromos,
  });
});
