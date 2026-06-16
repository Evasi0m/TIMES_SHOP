import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createServiceClient, getUser } from '../_shared/auth.ts';
import { handleOptions, jsonResponse, readJson } from '../_shared/http.ts';
import { quoteOrder } from '../_shared/quote-order.ts';

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  const body = await readJson<{
    items?: Array<{ tiktok_sku_id: string; quantity: number; expected_unit_price?: number; unit_price?: number }>;
    payment_method?: string;
    shipping_fee?: number;
    applied_promo_ids?: string[];
    coupon_code?: string | null;
    user_id?: string | null;
  }>(req);

  const user = await getUser(req);
  const userId = body.user_id ?? user?.id ?? null;

  const posUrl = Deno.env.get('POS_SUPABASE_URL') || 'https://zrymhhkqdcttqsdczfcr.supabase.co';
  const posKey = Deno.env.get('POS_SERVICE_ROLE_KEY') || '';
  if (!posKey) {
    return jsonResponse({
      ok: false,
      error: 'bridge_not_configured',
      message: 'ยังไม่ได้ตั้งค่า POS_SERVICE_ROLE_KEY บน Shop project',
    });
  }

  const shippingFee = Number(body.shipping_fee) || 0;

  const validateRes = await fetch(`${posUrl}/functions/v1/shop-validate-cart`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${posKey}`,
      apikey: posKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      items: body.items || [],
      shipping_fee: shippingFee,
      discount: 0,
    }),
  });
  const validated = await validateRes.json();
  if (!validated?.ok) {
    return jsonResponse(validated);
  }

  const subtotal = Number(validated.subtotal) || 0;
  const db = createServiceClient();
  const quote = await quoteOrder(db, {
    subtotal,
    shippingFee,
    paymentMethod: body.payment_method || '',
    appliedPromoIds: body.applied_promo_ids || [],
    couponCode: body.coupon_code || null,
    userId,
  });

  return jsonResponse({
    ok: true,
    valid: validated.valid ?? true,
    items: validated.items,
    subtotal,
    shipping_fee: quote.shipping_fee,
    discount: quote.discount,
    grand_total: quote.grand_total,
    breakdown: quote.breakdown,
    applied_promo_ids: quote.applied_promo_ids,
    coupon_code: quote.coupon_code,
    price_changed: validated.price_changed,
    stock_insufficient: validated.stock_insufficient,
    issues: validated.issues,
  });
});
