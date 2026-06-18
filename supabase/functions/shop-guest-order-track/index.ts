import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createServiceClient } from '../_shared/auth.ts';
import { createPosServiceClient, posNotConfiguredResponse } from '../_shared/pos-client.ts';
import { handleOptions, jsonResponse, readJson } from '../_shared/http.ts';
import { formatWebOrder } from '../_shared/web-orders.ts';

const ORDER_SELECT = `
  id, web_order_number, status, sale_date, grand_total, payment_method,
  shipping_recipient_name, shipping_phone, shipping_address, shipping_postal_code,
  buyer_name, payment_slip_status, web_fulfillment_status, tracking_no, shipped_at,
  sale_order_items (
    product_name, sku_name, quantity, unit_price, sku_image_url
  )
`;

async function hashGuestPhone(last4: string, orderId: number): Promise<string> {
  const data = new TextEncoder().encode(`${last4}:${orderId}`);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  const body = await readJson<{
    token?: string;
    web_order_number?: string;
    phone?: string;
  }>(req);

  const db = createServiceClient();
  const pos = createPosServiceClient();
  if (!pos) return jsonResponse(posNotConfiguredResponse());

  let accessRow: {
    order_id: number;
    web_order_number: string;
    expires_at: string | null;
  } | null = null;

  const token = String(body.token ?? '').trim();
  if (token) {
    const { data, error } = await db
      .from('shop_guest_order_access')
      .select('order_id, web_order_number, expires_at')
      .eq('lookup_token', token)
      .maybeSingle();
    if (error) return jsonResponse({ ok: false, error: 'db_error', message: error.message });
    accessRow = data;
  } else {
    const webOrderNumber = String(body.web_order_number ?? '').trim();
    const phone = String(body.phone ?? '').replace(/\D/g, '');
    const last4 = phone.slice(-4);
    if (!webOrderNumber || last4.length !== 4) {
      return jsonResponse({
        ok: false,
        error: 'validation_failed',
        message: 'กรุณากรอกเลขออเดอร์และเบอร์โทร 4 หลักท้าย',
      });
    }

    const { data: orders } = await pos
      .from('sale_orders')
      .select('id, web_order_number')
      .eq('channel', 'web')
      .ilike('web_order_number', webOrderNumber)
      .limit(1);

    const match = orders?.[0];
    if (!match) {
      return jsonResponse({ ok: false, error: 'not_found', message: 'ไม่พบออเดอร์' });
    }

    const phoneHash = await hashGuestPhone(last4, Number(match.id));
    const { data, error } = await db
      .from('shop_guest_order_access')
      .select('order_id, web_order_number, expires_at')
      .eq('web_order_number', match.web_order_number)
      .eq('phone_hash', phoneHash)
      .maybeSingle();
    if (error) return jsonResponse({ ok: false, error: 'db_error', message: error.message });
    accessRow = data;
  }

  if (!accessRow) {
    return jsonResponse({ ok: false, error: 'not_found', message: 'ไม่พบออเดอร์หรือข้อมูลไม่ตรงกัน' });
  }

  if (accessRow.expires_at && new Date(accessRow.expires_at).getTime() < Date.now()) {
    return jsonResponse({ ok: false, error: 'expired', message: 'ลิงก์ติดตามออเดอร์หมดอายุแล้ว' });
  }

  const { data: order, error: orderErr } = await pos
    .from('sale_orders')
    .select(ORDER_SELECT)
    .eq('id', accessRow.order_id)
    .eq('channel', 'web')
    .maybeSingle();

  if (orderErr) return jsonResponse({ ok: false, error: 'db_error', message: orderErr.message });
  if (!order) return jsonResponse({ ok: false, error: 'not_found', message: 'ไม่พบออเดอร์' });

  return jsonResponse({
    ok: true,
    order: formatWebOrder(order as Record<string, unknown>),
  });
});
