# TIMES_SHOP — Backend TODO (งานใน TIMES_POS)

> รายการงานที่ต้องทำใน repo **TIMES_POS** เพื่อให้ TIMES_SHOP ทำงานได้  
> เรียงตามลำดับ dependency — ทำจากบนลงล่าง  
> อ้างอิง API: [BACKEND_CONTRACT.md](./BACKEND_CONTRACT.md)

---

## สถานะ

| Phase | สถานะ | หมายเหตุ |
|-------|--------|----------|
| Phase 0 — Schema & Auth | ⬜ ยังไม่เริ่ม | |
| Phase 1 — Edge Functions MVP | ⬜ ยังไม่เริ่ม | |
| Phase 2 — POS Confirm Queue | ⬜ ยังไม่เริ่ม | |
| Phase 3 — Catalog Sync Cron | ⬜ ยังไม่เริ่ม | |
| Phase 4 — Promo (Phase 2 Shop) | ⬜ ยังไม่เริ่ม | |

---

## Phase 0 — Schema & Auth

### Migration `071_web_shop_foundation.sql` (ชื่อแนะนำ)

- [ ] **0.1** เพิ่ม `'web'` ใน `sale_orders_channel_check`
  ```sql
  -- อ้างอิง 022_harden_sale_order_channel_payment_checks.sql
  ALTER TABLE sale_orders DROP CONSTRAINT sale_orders_channel_check;
  ALTER TABLE sale_orders ADD CONSTRAINT sale_orders_channel_check
    CHECK (channel IS NULL OR channel IN ('tiktok','shopee','facebook','store','lazada','web'));
  ```

- [ ] **0.2** คอลัมน์ใหม่บน `sale_orders`
  - `customer_user_id`, `web_order_number`, `coupon_code`
  - `shipping_fee` (default 0), `payment_slip_path`, `payment_slip_status`, `payment_slip_verified_at`, `payment_slip_note`
  - Index: `(status, channel)` WHERE `status = 'pending' AND channel = 'web'`

- [ ] **0.3** ตาราง `customer_profiles` + RLS (owner only)

- [ ] **0.4** ตาราง `customer_addresses` + RLS (owner only)

- [ ] **0.5** ตาราง `storefront_products` (+ `deleted_at`, preserve admin flags on sync)

- [ ] **0.5b** ตาราง `shop_bank_accounts`

- [ ] **0.6** ตาราง `web_order_idempotency`
  ```sql
  web_order_idempotency (
    idempotency_key uuid PRIMARY KEY,
    order_id bigint REFERENCES sale_orders(id),
    created_at timestamptz DEFAULT now()
  )
  ```

- [ ] **0.7** Trigger: เมื่อ user signup ผ่าน Shop → set `app_role = 'customer'`
  - **ห้าม** override role ถ้า email เป็น staff อยู่แล้ว (admin/super_admin)

- [ ] **0.7b** Supabase Auth → **ปิด Confirm email** (ลูกค้าสั่งซื้อได้ทันทีหลัง signup)

- [ ] **0.8** Function `auth_is_customer()` → boolean

- [ ] **0.9** แก้ RLS สำหรับ `customer` role:
  - `sale_orders`: SELECT เฉพาะ `customer_user_id = auth.uid()`
  - `sale_order_items`: SELECT ผ่าน join order ของตัวเอง
  - **ห้าม** customer SELECT `products`, `receive_orders`, `shop_settings`, etc.
  - วิธี: policy แยก role หรือ revoke authenticated blanket read แล้วสร้าง policy ใหม่ (ระวัง breaking POS — test ทุก role)

> ⚠️ **ความเสี่ยงสูง:** migration 0.9 กระทบ RLS ทั้งระบบ — ทำใน migration แยก + ทดสอบ POS ทุก role หลัง apply

---

## Phase 1 — RPCs

### `place_web_order(p_payload jsonb) → jsonb`

- [ ] **1.1** Validate caller = customer (via Edge Function ที่ส่ง user id)
- [ ] **1.2** Server-side cart validation (reuse logic จาก validate-cart)
- [ ] **1.3** Generate `web_order_number`
- [ ] **1.4** Insert pending order + items
- [ ] **1.5** Map `tiktok_sku_id` → `product_id` via `tiktok_product_mappings`
- [ ] **1.6** Idempotency key support
- [ ] **1.7** Optional: save address to `customer_addresses`

### `get_customer_web_orders(p_limit, p_offset) → jsonb`

- [ ] **1.8** Customer-only, filter own orders

### `get_pending_web_orders(p_limit) → jsonb`

- [ ] **1.9** Staff-only (authenticated + NOT customer-only)
- [ ] **1.10** Shape คล้าย `get_pending_tiktok_orders` — items มี tiktok_sku_id, product_id, shipping

### Confirm flow

- [ ] **1.11** ขยาย `confirm_tiktok_sale_order` **หรือ** สร้าง `confirm_web_sale_order`
  - รองรับ `channel = 'web'`
  - ไม่ต้องมี `tiktok_order_id`
  - ตัดสต็อก + tax invoice เหมือนเดิม
  - `net_received` default = `grand_total` สำหรับ COD และ transfer (ยืนยันเมื่อ POS confirm)

---

## Phase 2 — Edge Functions

สร้างใน `supabase/functions/`:

| Function | ไฟล์ | JWT |
|----------|------|-----|
| `shop-get-catalog` | `shop-get-catalog/index.ts` | optional public |
| `shop-get-product` | `shop-get-product/index.ts` | optional |
| `shop-validate-cart` | `shop-validate-cart/index.ts` | optional |
| `shop-place-order` | `shop-place-order/index.ts` | **required** |
| `shop-get-my-orders` | `shop-get-my-orders/index.ts` | **required** |
| `shop-upsert-address` | `shop-upsert-address/index.ts` | **required** |
| `shop-list-addresses` | `shop-list-addresses/index.ts` | **required** |
| `shop-get-payment-info` | `shop-get-payment-info/index.ts` | optional |
| `shop-admin-settings-get` | `shop-admin-settings-get/index.ts` | admin JWT |
| `shop-admin-settings-update` | `shop-admin-settings-update/index.ts` | admin JWT |
| `shop-upload-slip` | `shop-upload-slip/index.ts` | **required** |
| `shop-verify-slip` | `shop-verify-slip/index.ts` | **required** |
| `shop-admin-products-list` | `shop-admin-products-list/index.ts` | admin JWT |
| `shop-admin-product-update` | `shop-admin-product-update/index.ts` | admin JWT |
| `shop-admin-bank-*` | CRUD bank accounts | admin JWT |
| `shop-admin-slips-queue` | slip review queue | admin JWT |
| `shop-admin-slip-review` | approve/reject | admin JWT |

- [ ] **2.1** Shared module `_shared/shop-auth.ts` — verify customer JWT, reject staff-only endpoints
- [ ] **2.2** Shared module `_shared/shop-cart.ts` — validate cart logic (ใช้ทั้ง EF และ RPC)
- [ ] **2.3** Deploy ทุก function
- [ ] **2.4** CORS: `SHOP_ALLOWED_ORIGINS=https://evasi0m.github.io,http://localhost:5173`
- [ ] **2.5** Storage bucket `payment-slips` (private) + RLS policies
- [ ] **2.6** `_shared/shop-slip-verify.ts` — MIME + size only → `pending_review` (ไม่มี OCR)

### Harden existing

- [ ] **2.7** `tiktok-products-search` — admin-only auth

---

## Phase 3 — Catalog Sync

- [ ] **3.1** Edge Function `shop-sync-catalog` (service_role / cron)
  - เรียก `searchTikTokProducts` paginate ทั้ง catalog
  - Upsert `storefront_products`
  - ดึง `unit_price` จาก TikTok product detail ถ้า search ไม่มีราคา
  - คำนวณ `stock_available = tiktok_qty` (**ไม่อิง POS**)
  - Preserve `is_published` / `deleted_at` ถ้า admin แก้แล้ว

- [ ] **3.2** pg_cron ทุก 10 นาที (หรือ 15 นาที)
  ```sql
  -- คล้าย 033_tiktok_cron.sql / 043_tiktok_poll_cron_5min.sql
  ```

- [ ] **3.3** Manual trigger จาก POS admin (ปุ่ม "Sync catalog to Shop") — optional

- [ ] **3.4** Seed ครั้งแรก: รัน sync manual หลัง deploy

---

## Phase 4 — POS UI

- [ ] **4.1** ขยาย pending panel — web orders + **ลิงก์ดูสลิป** (signed URL) ถ้า transfer

- [ ] **4.2** Event `web-pending-changed` คล้าย `tiktok-pending-changed`

- [ ] **4.3** Sales History: แสดง channel badge `web`

- [ ] **4.4** Guard: ห้าม manual POS sale ซ้ำกับ pending web order (คล้าย TikTok duplicate guard)

---

## Phase 5 — Promo (เมื่อ Shop Phase 2 พร้อม)

- [ ] **5.1** Migration: `coupons`, `promo_banners`, `coupon_redemptions`
- [ ] **5.2** RPC `validate_coupon(code, subtotal)`
- [ ] **5.3** Edge Functions: `shop-get-promos`, `shop-admin-*` (admin JWT)
- [ ] **5.4** Admin UI ใน Shop `/admin` หรือ POS

---

## Phase 6 — Tests

- [ ] **6.1** Vitest: `shop-cart.test.js` — validate price/stock logic
- [ ] **6.2** SQL test script: place_web_order → pending → confirm → stock decreased
- [ ] **6.3** RLS test: customer อ่าน order คนอื่นไม่ได้
- [ ] **6.4** RLS test: customer อ่าน products ไม่ได้

---

## Deploy checklist

```bash
# หลัง implement
supabase db push   # หรือ apply migration ใน SQL Editor

supabase functions deploy shop-get-catalog
supabase functions deploy shop-get-product
supabase functions deploy shop-validate-cart
supabase functions deploy shop-place-order
supabase functions deploy shop-get-my-orders
supabase functions deploy shop-upsert-address
supabase functions deploy shop-list-addresses
supabase functions deploy shop-get-payment-info
supabase functions deploy shop-upload-slip
supabase functions deploy shop-verify-slip
supabase functions deploy shop-admin-products-list
supabase functions deploy shop-admin-product-update
# ... shop-admin-bank-*, shop-admin-slips-*

# Secrets ใหม่ (ถ้ามี)
# SHOP_ALLOWED_ORIGINS=https://shop.example.com,http://localhost:5173
```

---

## ไฟล์ POS ที่จะถูกแก้ (reference)

| ไฟล์ | การเปลี่ยนแปลง |
|------|----------------|
| `supabase-migrations/071_web_shop_foundation.sql` | ใหม่ |
| `supabase/functions/shop-*/index.ts` | ใหม่ |
| `supabase/functions/_shared/shop-*.ts` | ใหม่ |
| `src/components/pos/TikTokConfirmPanel.jsx` | ขยาย web orders |
| `src/lib/ecommerce-channels.js` | เพิ่ม `web` channel |
| `src/main.jsx` | badge pending web count |

---

## Definition of Done (Backend)

- [ ] Shop เรียก `shop-get-catalog` ได้สินค้าจริง
- [ ] Shop เรียก `shop-place-order` → row ใน `sale_orders` pending
- [ ] POS เห็นออเดอร์ในคิวยืนยัน
- [ ] Confirm → active + stock ลด 1 ครั้ง
- [ ] Customer JWT อ่าน `products` ไม่ได้ (ทดสอบ manual)
- [ ] Staff workflow POS ไม่พัง
