import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createServiceClient, getUser } from '../_shared/auth.ts';
import { handleOptions, jsonResponse, readJson } from '../_shared/http.ts';

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

  const forward = {
    ...payload,
    customer_user_id: user?.id ?? payload.customer_user_id ?? null,
  };

  const validateRes = await fetch(`${posUrl}/functions/v1/shop-validate-cart`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${posKey}`,
      apikey: posKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      items: forward.items,
      shipping_fee: forward.shipping_fee,
      discount: forward.discount,
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
  return jsonResponse(placed);
});
