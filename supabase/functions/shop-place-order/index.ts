import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createServiceClient, getUser } from '../_shared/auth.ts';
import { handleOptions, jsonResponse, readJson } from '../_shared/http.ts';
import { quoteOrder, recordPromoRedemptions } from '../_shared/quote-order.ts';

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  const user = await getUser(req);
  const payload = await readJson<Record<string, unknown>>(req);

  const posUrl = Deno.env.get('POS_SUPABASE_URL') || 'https://zrymhhkqdcttqsdczfcr.supabase.co';
  const posKey = Deno.env.get('POS_SERVICE_ROLE_KEY') || '';
  if (!posKey) {
    return jsonResponse({
      ok: false,
      error: 'bridge_not_configured',
      message: 'ยังไม่ได้ตั้งค่า POS_SERVICE_ROLE_KEY บน Shop project',
    });
  }

  const customerUserId = user?.id ?? (payload.customer_user_id as string | null) ?? null;
  const shippingFee = Number(payload.shipping_fee) || 0;

  const validateRes = await fetch(`${posUrl}/functions/v1/shop-validate-cart`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${posKey}`,
      apikey: posKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      items: payload.items,
      shipping_fee: shippingFee,
      discount: 0,
    }),
  });
  const validated = await validateRes.json();
  if (!validated?.ok || !validated.valid) {
    return jsonResponse(validated?.ok === false ? validated : {
      ok: false,
      error: 'validation_failed',
      message: 'ตะกร้าไม่ผ่านการตรวจสอบ',
      ...validated,
    });
  }

  const subtotal = Number(validated.subtotal) || 0;
  const db = createServiceClient();
  const quote = await quoteOrder(db, {
    subtotal,
    shippingFee,
    paymentMethod: String(payload.payment_method || ''),
    appliedPromoIds: (payload.applied_promo_ids as string[]) || [],
    couponCode: (payload.coupon_code as string) || null,
    userId: customerUserId,
  });

  const forward = {
    ...payload,
    items: validated.items,
    customer_user_id: customerUserId,
    shipping_fee: quote.shipping_fee,
    discount: quote.discount,
    applied_promo_ids: quote.applied_promo_ids,
    coupon_code: quote.coupon_code,
    grand_total: quote.grand_total,
  };

  const placeRes = await fetch(`${posUrl}/functions/v1/shop-place-order`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${posKey}`,
      apikey: posKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(forward),
  });
  const placed = await placeRes.json();

  if (placed?.ok && placed.order_id && quote.applied_promo_ids.length) {
    await recordPromoRedemptions(
      db,
      Number(placed.order_id),
      customerUserId,
      quote.applied_promo_ids,
      quote.breakdown,
    );
  }

  if (placed?.ok && placed.order_id && !customerUserId) {
    const phone = String((payload.shipping as Record<string, unknown>)?.phone ?? '').replace(/\D/g, '');
    const last4 = phone.slice(-4);
    const orderId = Number(placed.order_id);
    const webOrderNumber = String(placed.web_order_number ?? '');
    if (last4.length === 4 && webOrderNumber) {
      const phoneHash = await hashGuestPhone(last4, orderId);
      const lookupToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
      const { error: guestErr } = await db.from('shop_guest_order_access').insert({
        order_id: orderId,
        web_order_number: webOrderNumber,
        phone_hash: phoneHash,
        lookup_token: lookupToken,
        expires_at: expiresAt,
      });
      if (!guestErr) {
        placed.guest_lookup_token = lookupToken;
      } else {
        console.error('shop_guest_order_access insert failed:', guestErr.message);
      }
    }
  }

  return jsonResponse(placed);
});

async function hashGuestPhone(last4: string, orderId: number): Promise<string> {
  const data = new TextEncoder().encode(`${last4}:${orderId}`);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
