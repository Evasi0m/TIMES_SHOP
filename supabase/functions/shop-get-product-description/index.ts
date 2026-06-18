import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createServiceClient } from '../_shared/auth.ts';
import { handleOptions, jsonResponse, readJson } from '../_shared/http.ts';
import { resolveProductDescription } from '../_shared/product-description.ts';

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  const body = await readJson<{ tiktok_product_id?: string }>(req);
  const productId = String(body.tiktok_product_id ?? '').trim();
  if (!productId) {
    return jsonResponse({
      ok: false,
      error: 'validation_failed',
      message: 'กรุณาระบุ tiktok_product_id',
    });
  }

  try {
    const db = createServiceClient();
    const { description, specs, cached } = await resolveProductDescription(db, productId);
    return jsonResponse({
      ok: true,
      tiktok_product_id: productId,
      description,
      specs,
      cached,
    });
  } catch (e) {
    return jsonResponse({
      ok: false,
      error: 'server_error',
      message: e instanceof Error ? e.message : 'โหลดคำอธิบายไม่สำเร็จ',
    });
  }
});
