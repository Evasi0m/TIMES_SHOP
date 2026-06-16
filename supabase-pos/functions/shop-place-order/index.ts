import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

function webOrderNumber() {
  const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = String(Math.floor(Math.random() * 9000) + 1000);
  return `WEB-${ymd}-${suffix}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const supa = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } },
    );

    const body = await req.json().catch(() => ({}));
    const idempotencyKey = body.idempotency_key ? String(body.idempotency_key) : null;

    if (idempotencyKey) {
      const { data: existing } = await supa
        .from('web_order_idempotency')
        .select('order_id')
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle();
      if (existing?.order_id) {
        const { data: order } = await supa
          .from('sale_orders')
          .select('id, web_order_number, status, grand_total, payment_method')
          .eq('id', existing.order_id)
          .single();
        if (order) {
          return json({
            ok: true,
            order_id: order.id,
            web_order_number: order.web_order_number,
            status: order.status,
            status_label: 'รอยืนยัน',
            grand_total: Number(order.grand_total),
            payment_method: order.payment_method,
            message: 'สั่งซื้อสำเร็จ ร้านจะยืนยันออเดอร์และแจ้งเมื่อจัดส่ง',
          });
        }
      }
    }

    const lines = (body.items as Array<Record<string, unknown>>) || [];
    const shipping = (body.shipping as Record<string, unknown>) || {};
    if (!lines.length) {
      return json({ ok: false, error: 'validation_failed', message: 'ตะกร้าว่าง' });
    }
    if (!shipping.recipient_name || !shipping.phone || !shipping.address_line || !shipping.province || !shipping.postal_code) {
      return json({ ok: false, error: 'validation_failed', message: 'กรุณากรอกที่อยู่จัดส่งให้ครบ' });
    }

    const paymentMethod = String(body.payment_method || 'cod');
    if (!['cod', 'transfer'].includes(paymentMethod)) {
      return json({ ok: false, error: 'validation_failed', message: 'ช่องทางชำระเงินไม่ถูกต้อง' });
    }
    const slipPath = body.slip_storage_path ? String(body.slip_storage_path) : null;
    if (paymentMethod === 'transfer' && !slipPath) {
      return json({ ok: false, error: 'validation_failed', message: 'กรุณาอัปโหลดสลิปโอนเงิน' });
    }

    const skuIds = lines.map((l) => String(l.tiktok_sku_id || '')).filter(Boolean);
    const { data: rows, error: loadErr } = await supa
      .from('storefront_products')
      .select('tiktok_sku_id, product_name, sku_name, seller_sku, image_url, unit_price, stock_available, pos_product_id')
      .in('tiktok_sku_id', skuIds)
      .eq('is_published', true)
      .is('deleted_at', null);
    if (loadErr) return json({ ok: false, error: 'db_error', message: loadErr.message });

    const map = new Map((rows || []).map((r) => [r.tiktok_sku_id, r]));
    let subtotal = 0;
    const orderItems: Record<string, unknown>[] = [];

    for (const line of lines) {
      const skuId = String(line.tiktok_sku_id || '');
      const qty = Math.max(1, Number(line.quantity) || 1);
      const row = map.get(skuId);
      if (!row) {
        return json({ ok: false, error: 'not_found', message: 'ไม่พบสินค้าในตะกร้า' });
      }
      const stock = Number(row.stock_available) || 0;
      if (stock < qty) {
        return json({ ok: false, error: 'stock_insufficient', message: 'สินค้าบางรายการมีไม่พอ' });
      }
      const unitPrice = Number(row.unit_price) || 0;
      subtotal += unitPrice * qty;
      orderItems.push({ row, qty, unitPrice, skuId });
    }

    const shippingFee = Number(body.shipping_fee) || 0;
    const discount = Math.max(0, Number(body.discount) || 0);
    const totalAfterDiscount = Math.max(0, subtotal - discount);
    const grandTotal = Math.max(0, totalAfterDiscount + shippingFee);
    const addressParts = [
      shipping.address_line,
      shipping.subdistrict,
      shipping.district,
      shipping.province,
      shipping.postal_code,
    ].filter(Boolean);

    const webNo = webOrderNumber();
    const now = new Date().toISOString();

    const { data: order, error: orderErr } = await supa
      .from('sale_orders')
      .insert({
        sale_date: now,
        channel: 'web',
        status: 'pending',
        payment_method: paymentMethod,
        subtotal,
        total_after_discount: totalAfterDiscount,
        grand_total: grandTotal,
        shipping_fee: shippingFee,
        customer_user_id: body.customer_user_id || null,
        web_order_number: webNo,
        coupon_code: body.coupon_code || null,
        buyer_name: String(shipping.recipient_name),
        shipping_recipient_name: String(shipping.recipient_name),
        shipping_phone: String(shipping.phone),
        shipping_address: addressParts.join(' '),
        shipping_postal_code: String(shipping.postal_code),
        payment_slip_path: slipPath,
        payment_slip_status: paymentMethod === 'transfer' ? 'pending_review' : null,
        notes: shipping.notes ? String(shipping.notes) : null,
        price_includes_vat: true,
        vat_rate: 7,
      })
      .select('id, web_order_number, status, grand_total, payment_method')
      .single();

    if (orderErr || !order) {
      return json({ ok: false, error: 'db_error', message: orderErr?.message || 'สร้างออเดอร์ไม่สำเร็จ' });
    }

    const itemRows = orderItems.map(({ row, qty, unitPrice, skuId }) => ({
      sale_order_id: order.id,
      product_id: row.pos_product_id ?? null,
      product_name: row.product_name,
      quantity: qty,
      unit_price: unitPrice,
      display_unit_price: unitPrice,
      tiktok_sku_id: skuId,
      seller_sku: row.seller_sku,
      sku_name: row.sku_name,
      sku_image_url: row.image_url,
    }));

    const { error: itemsErr } = await supa.from('sale_order_items').insert(itemRows);
    if (itemsErr) {
      await supa.from('sale_orders').delete().eq('id', order.id);
      return json({ ok: false, error: 'db_error', message: itemsErr.message });
    }

    if (idempotencyKey) {
      await supa.from('web_order_idempotency').insert({
        idempotency_key: idempotencyKey,
        order_id: order.id,
      });
    }

    return json({
      ok: true,
      order_id: order.id,
      web_order_number: order.web_order_number,
      status: order.status,
      status_label: 'รอยืนยัน',
      grand_total: Number(order.grand_total),
      payment_method: order.payment_method,
      message: 'สั่งซื้อสำเร็จ ร้านจะยืนยันออเดอร์และแจ้งเมื่อจัดส่ง',
    });
  } catch (e) {
    return json({ ok: false, error: 'server_error', message: e instanceof Error ? e.message : 'place order failed' });
  }
});
