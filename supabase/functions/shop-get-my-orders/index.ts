import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { getUser, requireAuth } from '../_shared/auth.ts';
import { handleOptions, jsonResponse, readJson } from '../_shared/http.ts';
import { createPosServiceClient, posNotConfiguredResponse } from '../_shared/pos-client.ts';
import { formatWebOrder } from '../_shared/web-orders.ts';

const ORDER_SELECT = `
  id, web_order_number, status, sale_date, grand_total, payment_method,
  shipping_recipient_name, shipping_phone, shipping_address, shipping_postal_code,
  buyer_name, payment_slip_status,
  sale_order_items (
    product_name, sku_name, quantity, unit_price, sku_image_url
  )
`;

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  const user = await getUser(req);
  const denied = requireAuth(user);
  if (denied) return jsonResponse(denied);

  const pos = createPosServiceClient();
  if (!pos) return jsonResponse(posNotConfiguredResponse());

  const body = await readJson<{ page?: number; page_size?: number; order_id?: number | string }>(req);
  const page = Math.max(1, Number(body.page) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(body.page_size) || 20));
  const offset = (page - 1) * pageSize;

  let query = pos
    .from('sale_orders')
    .select(ORDER_SELECT, { count: 'exact' })
    .eq('channel', 'web')
    .eq('customer_user_id', user!.id)
    .order('sale_date', { ascending: false });

  if (body.order_id != null && body.order_id !== '') {
    query = query.eq('id', body.order_id);
  }

  const { data, error, count } = await query.range(offset, offset + pageSize - 1);
  if (error) return jsonResponse({ ok: false, error: 'db_error', message: error.message });

  const orders = (data ?? []).map((row) => formatWebOrder(row as Record<string, unknown>));

  if (body.order_id != null && body.order_id !== '') {
    const order = orders[0] ?? null;
    if (!order) {
      return jsonResponse({ ok: false, error: 'not_found', message: 'ไม่พบออเดอร์' });
    }
    return jsonResponse({ ok: true, order, orders: [order], total: 1 });
  }

  return jsonResponse({ ok: true, orders, total: count ?? orders.length });
});
