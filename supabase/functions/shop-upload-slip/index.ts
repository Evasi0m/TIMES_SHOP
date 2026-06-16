import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createServiceClient, getUser } from '../_shared/auth.ts';
import { handleOptions, jsonResponse } from '../_shared/http.ts';
import { SLIP_MAX_BYTES, SLIP_MIME_TYPES, slipPathForUser } from '../_shared/web-orders.ts';

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'method_not_allowed', message: 'POST only' }, 405);
  }

  const user = await getUser(req);
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return jsonResponse({ ok: false, error: 'invalid_file', message: 'รูปแบบไฟล์ไม่ถูกต้อง' });
  }

  const file = form.get('file');
  if (!(file instanceof File)) {
    return jsonResponse({ ok: false, error: 'invalid_file', message: 'กรุณาเลือกไฟล์สลิป' });
  }

  const mime = file.type || 'application/octet-stream';
  if (!SLIP_MIME_TYPES.has(mime)) {
    return jsonResponse({ ok: false, error: 'invalid_file', message: 'รองรับเฉพาะ JPG / PNG / PDF' });
  }
  if (file.size <= 0 || file.size > SLIP_MAX_BYTES) {
    return jsonResponse({ ok: false, error: 'invalid_file', message: 'ไฟล์ต้องไม่เกิน 5MB' });
  }

  const ext = mime === 'image/png'
    ? 'png'
    : mime === 'application/pdf'
    ? 'pdf'
    : 'jpg';
  const uploadId = crypto.randomUUID();
  const fileName = `${uploadId}.${ext}`;
  const storagePath = slipPathForUser(user?.id ?? null, fileName);
  const objectKey = storagePath.replace(/^payment-slips\//, '');

  const db = createServiceClient();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error: upErr } = await db.storage
    .from('payment-slips')
    .upload(objectKey, bytes, { contentType: mime, upsert: false });

  if (upErr) {
    return jsonResponse({ ok: false, error: 'upload_failed', message: upErr.message });
  }

  return jsonResponse({
    ok: true,
    storage_path: storagePath,
    upload_id: uploadId,
  });
});
