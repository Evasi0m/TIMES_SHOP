import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { getUser, requireAdmin } from '../_shared/auth.ts';
import { handleOptions, jsonResponse, readJson } from '../_shared/http.ts';
import { createPosServiceClient, posNotConfiguredResponse } from '../_shared/pos-client.ts';

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  const user = await getUser(req);
  const denied = requireAdmin(user);
  if (denied) return jsonResponse(denied);

  const pos = createPosServiceClient();
  if (!pos) return jsonResponse(posNotConfiguredResponse());

  const body = await readJson<{
    order_id?: number | string;
    action?: string;
    note?: string;
  }>(req);

  const orderId = body.order_id;
  const action = body.action ? String(body.action) : '';
  if (orderId == null || orderId === '') {
    return jsonResponse({ ok: false, error: 'validation_failed', message: 'กรุณาระบุ order_id' });
  }
  if (!['approve', 'reject'].includes(action)) {
    return jsonResponse({ ok: false, error: 'validation_failed', message: 'action ต้องเป็น approve หรือ reject' });
  }

  const { data: existing, error: loadErr } = await pos
    .from('sale_orders')
    .select('id, web_order_number, payment_slip_status, payment_method, channel')
    .eq('id', orderId)
    .maybeSingle();

  if (loadErr) return jsonResponse({ ok: false, error: 'db_error', message: loadErr.message });
  if (!existing || existing.channel !== 'web') {
    return jsonResponse({ ok: false, error: 'not_found', message: 'ไม่พบออเดอร์' });
  }
  if (existing.payment_method !== 'transfer') {
    return jsonResponse({ ok: false, error: 'validation_failed', message: 'ออเดอร์นี้ไม่ใช่การโอนเงิน' });
  }
  if (existing.payment_slip_status !== 'pending_review') {
    return jsonResponse({ ok: false, error: 'validation_failed', message: 'สลิปนี้ตรวจแล้วหรือไม่มีสลิปรอตรวจ' });
  }

  const nextStatus = action === 'approve' ? 'approved' : 'rejected';
  const note = body.note ? String(body.note).trim() : null;

  const { data: updated, error: updErr } = await pos
    .from('sale_orders')
    .update({
      payment_slip_status: nextStatus,
      payment_slip_verified_at: new Date().toISOString(),
      payment_slip_note: note,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .select('id, web_order_number, payment_slip_status, payment_slip_note, payment_slip_verified_at')
    .single();

  if (updErr || !updated) {
    return jsonResponse({ ok: false, error: 'db_error', message: updErr?.message || 'อัปเดตไม่สำเร็จ' });
  }

  return jsonResponse({
    ok: true,
    order: updated,
    message: action === 'approve' ? 'อนุมัติสลิปแล้ว' : 'ปฏิเสธสลิปแล้ว',
  });
});
