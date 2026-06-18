import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createServiceClient, getUser, requireAdmin } from '../_shared/auth.ts';
import { handleOptions, jsonResponse, readJson } from '../_shared/http.ts';

function validateImageUrl(url: unknown, label: string) {
  if (url == null || url === '') return { ok: true as const, value: null };
  const trimmed = String(url).trim();
  if (!trimmed) return { ok: true as const, value: null };
  try {
    const parsed = new URL(trimmed);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { ok: false as const, message: `URL ${label}ต้องขึ้นต้นด้วย http หรือ https` };
    }
    return { ok: true as const, value: trimmed };
  } catch {
    return { ok: false as const, message: `URL ${label}ไม่ถูกต้อง` };
  }
}

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  const user = await getUser(req);
  const denied = requireAdmin(user);
  if (denied) return jsonResponse(denied);

  const body = await readJson<{
    shipping_fee?: number;
    shipping_label?: string;
    profile_image_url?: string | null;
    cover_image_url?: string | null;
    units_sold_display?: number | string | null;
  }>(req);

  const db = createServiceClient();
  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (body.shipping_fee != null) {
    if (!Number.isFinite(Number(body.shipping_fee)) || Number(body.shipping_fee) < 0) {
      return jsonResponse({ ok: false, error: 'validation_failed', message: 'กรุณากรอกค่าจัดส่งที่ถูกต้อง' });
    }
    patch.shipping_fee = Number(body.shipping_fee);
  }

  if (body.shipping_label != null) {
    patch.shipping_label = String(body.shipping_label);
  }

  if ('profile_image_url' in body) {
    const imageCheck = validateImageUrl(body.profile_image_url, 'รูปโปรไฟล์');
    if (!imageCheck.ok) {
      return jsonResponse({ ok: false, error: 'validation_failed', message: imageCheck.message });
    }
    patch.profile_image_url = imageCheck.value;
  }

  if ('cover_image_url' in body) {
    const imageCheck = validateImageUrl(body.cover_image_url, 'รูป cover');
    if (!imageCheck.ok) {
      return jsonResponse({ ok: false, error: 'validation_failed', message: imageCheck.message });
    }
    patch.cover_image_url = imageCheck.value;
  }

  if ('units_sold_display' in body) {
    if (body.units_sold_display == null || body.units_sold_display === '') {
      patch.units_sold_display = null;
    } else {
      const n = Number(body.units_sold_display);
      if (!Number.isFinite(n) || n < 0) {
        return jsonResponse({
          ok: false,
          error: 'validation_failed',
          message: 'ยอดขายที่แสดงต้องเป็นตัวเลข 0 ขึ้นไป',
        });
      }
      patch.units_sold_display = Math.floor(n);
    }
  }

  if (Object.keys(patch).length === 1) {
    return jsonResponse({ ok: false, error: 'validation_failed', message: 'ไม่มีข้อมูลที่จะบันทึก' });
  }

  const { data, error } = await db
    .from('shop_settings')
    .update(patch)
    .eq('id', 1)
    .select('shipping_fee, shipping_label, profile_image_url, cover_image_url, units_sold_display')
    .single();
  if (error) return jsonResponse({ ok: false, error: 'db_error', message: error.message });

  return jsonResponse({
    ok: true,
    shipping_fee: Number(data.shipping_fee),
    shipping_label: data.shipping_label,
    profile_image_url: data.profile_image_url ? String(data.profile_image_url).trim() : null,
    cover_image_url: data.cover_image_url ? String(data.cover_image_url).trim() : null,
    units_sold_display:
      data.units_sold_display != null ? Number(data.units_sold_display) : null,
  });
});
