import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createServiceClient, getUser } from '../_shared/auth.ts';
import { handleOptions, jsonResponse, readJson } from '../_shared/http.ts';
import {
  SLIP_MAX_BYTES,
  SLIP_MIME_TYPES,
  slipObjectKey,
  slipPathAllowedForUser,
} from '../_shared/web-orders.ts';

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  const user = await getUser(req);
  const body = await readJson<{ storage_path?: string; expected_amount?: number }>(req);
  const storagePath = body.storage_path ? String(body.storage_path) : '';

  if (!storagePath || !slipPathAllowedForUser(storagePath, user?.id ?? null)) {
    return jsonResponse({ ok: false, error: 'invalid_file', message: 'ไม่พบไฟล์สลิปหรือไม่มีสิทธิ์เข้าถึง' });
  }

  const objectKey = slipObjectKey(storagePath);
  if (!objectKey) {
    return jsonResponse({ ok: false, error: 'invalid_file', message: 'path สลิปไม่ถูกต้อง' });
  }

  const db = createServiceClient();
  const { data: blob, error: dlErr } = await db.storage.from('payment-slips').download(objectKey);
  if (dlErr || !blob) {
    return jsonResponse({ ok: false, error: 'invalid_file', message: 'ไม่พบไฟล์สลิป' });
  }

  const size = blob.size;
  if (size <= 0 || size > SLIP_MAX_BYTES) {
    return jsonResponse({ ok: false, error: 'invalid_file', message: 'ไฟล์ต้องไม่เกิน 5MB' });
  }

  const mime = blob.type || 'application/octet-stream';
  if (!SLIP_MIME_TYPES.has(mime)) {
    return jsonResponse({ ok: false, error: 'invalid_file', message: 'รองรับเฉพาะ JPG / PNG / PDF' });
  }

  return jsonResponse({
    ok: true,
    status: 'pending_review',
    message: 'อัปโหลดสลิปสำเร็จ — รอเจ้าหน้าที่ตรวจสอบ',
  });
});
