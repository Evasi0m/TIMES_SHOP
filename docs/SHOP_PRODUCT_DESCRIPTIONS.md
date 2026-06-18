# Shop Product Descriptions (TikTok → Shop Supabase)

คำอธิบายสินค้า (PDP) เก็บใน Shop project แยกจาก POS — ดึงจาก TikTok Product Detail API ครั้งเดียวต่อ `tiktok_product_id` ไม่ refresh ซ้ำ

## Architecture

- **Catalog (ราคา/สต็อก/SKU):** POS `shop-get-product` — ไม่เปลี่ยน
- **Description:** Shop `shop-get-product-description` → ตาราง `shop_product_descriptions`
- **Backfill:** Shop `shop-admin-sync-descriptions` (admin JWT)

## Shop Supabase secrets (Dashboard → Edge Functions)

คัดลอกจาก POS project env — **ไม่ commit ลง git**

| Secret | Required | Notes |
|--------|----------|-------|
| `TIKTOK_APP_KEY` | yes | TikTok app key (same as POS) |
| `TIKTOK_APP_SECRET` | yes | TikTok app secret (same as POS) |
| `TIKTOK_ACCESS_TOKEN` | optional | ถ้าไม่ตั้ง จะอ่านจาก POS `tiktok_tokens` ผ่าน `POS_SERVICE_ROLE_KEY` |
| `TIKTOK_SHOP_CIPHER` | optional | ถ้าไม่ตั้ง จะอ่านจาก POS `tiktok_tokens` |
| `POS_SERVICE_ROLE_KEY` | yes* | catalog bridge + token bridge |
| `POS_SUPABASE_URL` | optional | default `https://zrymhhkqdcttqsdczfcr.supabase.co` |
| `SHOP_POS_BRIDGE_SECRET` | yes* | shared secret สำหรับ POS `shop-get-tiktok-description` (ตั้งค่าเดียวกันทั้ง Shop + POS) |

**ขั้นต่ำ:** ตั้ง `SHOP_POS_BRIDGE_SECRET` ค่าเดียวกันบน Shop และ POS project — Shop เรียก POS `shop-get-tiktok-description` อัตโนมัติ (ไม่ต้อง copy POS service role JWT)

\* ใช้อย่างใดอย่างหนึ่ง: `SHOP_POS_BRIDGE_SECRET` (แนะนำ) หรือ `POS_SERVICE_ROLE_KEY` = POS service role JWT

ถ้าต้องการ bypass POS bridge สามารถตั้ง `TIKTOK_APP_KEY` + `TIKTOK_APP_SECRET` (+ token/cipher ถ้าต้องการ) บน Shop project ได้

## Deploy

```bash
# Apply migration on Shop project
supabase db push

# Deploy Edge Functions (Shop project)
supabase functions deploy shop-get-product-description
supabase functions deploy shop-admin-sync-descriptions
```

## Backfill ครั้งแรก (~2k products)

เรียกทีละ batch (25 รายการ/ครั้ง) จน `remaining_estimate` เป็น 0:

```bash
curl -X POST "$SHOP_URL/functions/v1/shop-admin-sync-descriptions" \
  -H "Authorization: Bearer $ADMIN_JWT" \
  -H "apikey: $SHOP_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"batch_size":25,"delay_ms":300}'
```

หรือจาก browser console ขณะ login admin:

```js
import { shopApi } from './src/lib/shop-api.js';
let remaining = 1;
while (remaining > 0) {
  const res = await shopApi.adminSyncDescriptions({ batch_size: 25, delay_ms: 300 });
  console.log(res);
  remaining = res.remaining_estimate ?? 0;
}
```

## สินค้าใหม่บน TikTok

ไม่ต้อง cron — เปิด PDP ครั้งแรกจะ cache miss แล้วดึงจาก TikTok อัตโนมัติ

## API

### `shop-get-product-description` (public)

Request: `{ "tiktok_product_id": "1734098765432109876" }`

Response: `{ "ok": true, "description": "...", "cached": true|false }`

### `shop-admin-sync-descriptions` (admin)

Request: `{ "batch_size": 25, "delay_ms": 300 }`

Response: `{ "ok": true, "synced": 25, "skipped": 0, "failed": 0, "remaining_estimate": 1975 }`
