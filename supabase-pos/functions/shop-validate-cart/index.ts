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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const supa = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } },
    );

    const body = await req.json().catch(() => ({}));
    const lines = (body.items as Array<Record<string, unknown>>) || [];
    if (!lines.length) {
      return json({ ok: false, error: 'validation_failed', message: 'ตะกร้าว่าง' });
    }

    const skuIds = lines.map((l) => String(l.tiktok_sku_id || '')).filter(Boolean);
    const { data: rows, error } = await supa
      .from('storefront_products')
      .select('tiktok_sku_id, product_name, sku_name, image_url, unit_price, stock_available, pos_product_id')
      .in('tiktok_sku_id', skuIds)
      .eq('is_published', true)
      .is('deleted_at', null);
    if (error) return json({ ok: false, error: 'db_error', message: error.message });

    const map = new Map((rows || []).map((r) => [r.tiktok_sku_id, r]));
    const issues: Record<string, unknown>[] = [];
    let priceChanged = false;
    let stockInsufficient = false;
    const validated: Record<string, unknown>[] = [];
    let subtotal = 0;

    for (const line of lines) {
      const skuId = String(line.tiktok_sku_id || '');
      const qty = Math.max(1, Number(line.quantity) || 1);
      const expected = Number(line.expected_unit_price ?? line.unit_price) || 0;
      const row = map.get(skuId);
      if (!row) {
        issues.push({ tiktok_sku_id: skuId, type: 'not_found', message: 'ไม่พบสินค้า' });
        continue;
      }
      const unitPrice = Number(row.unit_price) || 0;
      const stock = Number(row.stock_available) || 0;
      if (stock < qty) {
        stockInsufficient = true;
        issues.push({
          tiktok_sku_id: skuId,
          type: 'stock_insufficient',
          stock_available: stock,
          message: 'สินค้ามีไม่พอ',
        });
      }
      if (expected > 0 && Math.abs(expected - unitPrice) > 0.009) {
        priceChanged = true;
        issues.push({
          tiktok_sku_id: skuId,
          type: 'price_changed',
          expected_unit_price: expected,
          current_unit_price: unitPrice,
          message: 'ราคาเปลี่ยนแปลง กรุณายืนยันราคาใหม่',
        });
      }
      const lineTotal = unitPrice * qty;
      subtotal += lineTotal;
      validated.push({
        tiktok_sku_id: skuId,
        quantity: qty,
        unit_price: unitPrice,
        line_total: lineTotal,
        stock_available: stock,
        product_name: row.product_name,
        sku_name: row.sku_name,
        image_url: row.image_url,
        pos_product_id: row.pos_product_id,
      });
    }

    const shippingFee = Number(body.shipping_fee) || 0;
    const discount = Number(body.discount) || 0;
    const grandTotal = Math.max(0, subtotal + shippingFee - discount);
    const valid = issues.length === 0;

    return json({
      ok: true,
      valid,
      items: validated,
      subtotal,
      shipping_fee: shippingFee,
      discount,
      grand_total: grandTotal,
      price_changed: priceChanged,
      stock_insufficient: stockInsufficient,
      issues: issues.length ? issues : undefined,
    });
  } catch (e) {
    return json({ ok: false, error: 'server_error', message: e instanceof Error ? e.message : 'validate failed' });
  }
});
