# TIMES_SHOP — Backend Contract

> **Source of truth สำหรับ API** ระหว่าง TIMES_SHOP (client) และ Supabase (backend)  
> Backend implement ใน **TIMES_POS** repo — migrations + Edge Functions  
> Shop **ห้าม** ออกแบบ interface เองนอกเอกสารนี้โดยไม่ update contract

---

## 1. ภาพรวม

```
TIMES_SHOP (browser)
    │  Authorization: Bearer <customer JWT>  (ยกเว้น catalog อาจ public)
    │  supabase.functions.invoke('shop-*')
    ▼
Edge Functions (ใหม่ — deploy จาก TIMES_POS)
    │  service_role + TikTok token (ถ้าต้อง refresh cache)
    ▼
Postgres RPCs (ใหม่) + ตารางใหม่
    │
    ▼
sale_orders / sale_order_items (มีอยู่แล้ว)
```

### Supabase Project

| Key | Value |
|-----|-------|
| Project ref | `zrymhhkqdcttqsdczfcr` |
| URL | `https://zrymhhkqdcttqsdczfcr.supabase.co` |
| Client key | **anon key เท่านั้น** — จาก Dashboard → Settings → API |

---

## 2. Auth & Roles

### 2.1 Role model

| Role | ที่เก็บ | ใช้กับ |
|------|---------|--------|
| `customer` | `auth.users.raw_app_meta_data.app_role` | ลูกค้า Shop |
| `admin` | เดิม POS | admin Shop / POS |
| `super_admin` | เดิม POS | เต็มสิทธิ์ |
| `visitor` | เดิม POS | พนักงาน read-only POS |

**ห้าม** ใช้ `raw_user_meta_data` สำหรับ role — ลูกค้าแก้เองได้ (ดู POS migration `005_user_roles.sql`)

### 2.2 Customer signup flow (implement ใน POS)

1. ลูกค้า `signUp` ผ่าน Supabase Auth (Shop)
2. Trigger `on_auth_user_created` → set `app_role = 'customer'` ใน `raw_app_meta_data`
3. สร้าง row ใน `customer_profiles`

**ห้าม** ให้ลูกค้า signup แล้วได้ role `visitor` (จะอ่าน POS data ได้)

### 2.3 Staff ใช้ Shop admin

- Staff login ด้วย email เดิม → JWT มี `app_role = admin`
- Shop `/admin` เช็ค `app_metadata.app_role IN ('admin', 'super_admin')`

### 2.4 Email confirmation

- **ปิด Confirm email** ใน Supabase Auth (Email provider)
- ลูกค้า signup แล้วได้ session ทันที — **สั่งซื้อได้โดยไม่ต้อง verify email**
- Edge Functions / RPC ตรวจแค่ `auth.uid()` ไม่เช็ค `email_confirmed_at`

---

## 3. ตารางใหม่ (implement ใน TIMES_POS)

### 3.1 `customer_profiles`

```sql
-- สรุป schema — ดู migration จริงใน BACKEND_TODO.md
customer_profiles (
  user_id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name    text,
  phone           text,
  default_address_id uuid REFERENCES customer_addresses(id),
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
)
```

**RLS:** ลูกค้าอ่าน/แก้ row ของ `auth.uid()` เท่านั้น

### 3.2 `customer_addresses`

```sql
customer_addresses (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label           text,              -- 'บ้าน', 'ที่ทำงาน'
  recipient_name  text NOT NULL,
  phone           text NOT NULL,
  address_line    text NOT NULL,
  subdistrict     text,
  district        text,
  province        text NOT NULL,
  postal_code     text NOT NULL,
  is_default      boolean DEFAULT false,
  created_at      timestamptz DEFAULT now()
)
```

**RLS:** `user_id = auth.uid()`

### 3.3 `storefront_products` (cache catalog)

```sql
storefront_products (
  tiktok_sku_id     text PRIMARY KEY,
  tiktok_product_id text,
  product_name      text NOT NULL,
  sku_name          text,
  seller_sku        text,
  image_url         text,
  unit_price        numeric(12,2) NOT NULL,
  stock_available   integer NOT NULL DEFAULT 0,
  pos_product_id    bigint REFERENCES products(id),  -- จาก tiktok_product_mappings
  is_published      boolean DEFAULT true,            -- admin ปิดได้; sync ใหม่ default true
  deleted_at        timestamptz,                       -- admin soft-delete
  sort_order        integer DEFAULT 0,
  description       text,
  synced_at         timestamptz,
  units_sold        integer NOT NULL DEFAULT 0,       -- cache ยอดขาย POS ทุกช่องทาง
  units_sold_synced_at timestamptz,                   -- ครั้งล่าสุดที่ refresh
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
)
```

**Catalog query:** `is_published = true AND deleted_at IS NULL`  
**Stock sync:** `stock_available = tiktok_qty` (ไม่อิง POS)  
**Price sync:** `unit_price` จาก TikTok เท่านั้น  
**Units sold:** cache จาก `sale_order_items` ทุกช่องทาง POS ที่ map กับ SKU นี้ — refresh โดย `refresh_storefront_units_sold()` หลัง `shop-sync-catalog` / background (~6h)

### 3.4 `shop_bank_accounts`

```sql
shop_bank_accounts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name       text NOT NULL,
  account_number  text NOT NULL,
  account_name    text NOT NULL,
  is_active       boolean DEFAULT true,
  sort_order      integer DEFAULT 0,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
)
```

Admin CRUD ผ่าน `/admin` — **ว่างได้ตอนเริ่ม** (checkout โอนแสดงข้อความ "ร้านกำลังตั้งค่าบัญชี")

### 3.5 `coupons` (Phase 2)

```sql
coupons (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code            text UNIQUE NOT NULL,
  discount_type   text CHECK (discount_type IN ('percent', 'amount')),
  discount_value  numeric(12,2) NOT NULL,
  min_order       numeric(12,2) DEFAULT 0,
  max_uses        integer,
  used_count      integer DEFAULT 0,
  starts_at       timestamptz,
  expires_at      timestamptz,
  is_active       boolean DEFAULT true,
  created_at      timestamptz DEFAULT now()
)
```

### 3.5 `promo_banners` (Phase 2)

```sql
promo_banners (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind            text CHECK (kind IN ('top_bar', 'hero', 'popup')),
  title           text,
  body            text,
  image_url       text,
  link_url        text,
  starts_at       timestamptz,
  expires_at      timestamptz,
  is_active       boolean DEFAULT true,
  sort_order      integer DEFAULT 0,
  created_at      timestamptz DEFAULT now()
)
```

### 3.6 ขยาย `sale_orders`

```sql
ALTER TABLE sale_orders
  ADD COLUMN IF NOT EXISTS customer_user_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS web_order_number text UNIQUE,
  ADD COLUMN IF NOT EXISTS coupon_code text,
  ADD COLUMN IF NOT EXISTS shipping_fee numeric(12,2) DEFAULT 0,  -- MVP = 0 ส่งฟรี
  ADD COLUMN IF NOT EXISTS payment_slip_path text,
  ADD COLUMN IF NOT EXISTS payment_slip_status text,  -- pending_review|approved|rejected
  ADD COLUMN IF NOT EXISTS payment_slip_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS payment_slip_note text;

-- payment_slip_status CHECK ใน migration
-- channel ต้องเพิ่ม 'web'
```

**Transfer orders:** `payment_method = 'transfer'` ต้องมี `payment_slip_path` + `payment_slip_status` ก่อน POS confirm (แนะนำ)

---

## 4. Edge Functions (ใหม่)

ทุก function ใช้ CORS สำหรับ Shop domain  
ทุก function คืน `{ ok: true, ... }` หรือ `{ ok: false, error: "..." }`  
HTTP status **200** เสมอ (pattern เดียวกับ `tiktok-products-search`) — client อ่าน `data.ok`

### 4.1 `shop-get-catalog`

**Auth:** ไม่บังคับ (public catalog) — rate limit แนะนำ  
**Deploy:** `--no-verify-jwt` หรือ verify optional

**Request:**
```json
{
  "page": 1,
  "page_size": 24,
  "q": "219",
  "sort": "newest",
  "series": "standard",
  "sub_type": "st-digi",
  "strap_material": "D",
  "dial_color": "3",
  "price_min": 1000,
  "price_max": 5000,
  "include_facets": true,
  "include_items": true
}
```

| Field | Type | Notes |
|-------|------|-------|
| `page`, `page_size`, `q`, `sort` | เหมือนเดิม | `sort`: `newest` \| `price_asc` \| `price_desc` |
| `series` | string? | `gshock` \| `babyg` \| `edifice` \| `protrek` \| `standard` — **ไม่ใช้เมื่อมี `q`** |
| `sub_type` | string? | ตาม `SERIES_SUBS` (เช่น `st-digi`, `gs-anadigi`) |
| `strap_material` | string? | `R` \| `D` \| `L` \| … (รหัสวัสดุ CASIO) |
| `dial_color` | string? | `1`–`9` |
| `price_min`, `price_max` | number? | inclusive; สลับอัตโนมัติถ้า min > max |
| `include_facets` | boolean? | คืน `facets` สำหรับ filter UI (default `false`) |
| `include_items` | boolean? | คืน `items` + `total` (default `true`); ตั้ง `false` เพื่อโหลด facets อย่างเดียว |
| `group_by` | string? | `product` (default) \| `sku` — `product` = 1 การ์ดต่อ TikTok listing |

**Response (`group_by: product` — default):**
```json
{
  "ok": true,
  "group_by": "product",
  "items": [
    {
      "tiktok_product_id": "1734098765432109876",
      "product_name": "Casio G-Shock GA-2100",
      "image_url": "https://...",
      "sku_count": 12,
      "price_min": 3900,
      "price_max": 4500,
      "default_sku_id": "1734123456789012345",
      "tiktok_sku_id": "1734123456789012345",
      "in_stock": true,
      "stock_available": 24
    }
  ],
  "total": 373,
  "page": 1,
  "page_size": 24,
  "facets": { }
}
```

**Response (`group_by: sku` — legacy flat):**
```json
{
  "ok": true,
  "group_by": "sku",
  "items": [
    {
      "tiktok_sku_id": "1734123456789012345",
      "tiktok_product_id": "1734098765432109876",
      "product_name": "Seiko 5 SNK809",
      "sku_name": "SNK809K1",
      "seller_sku": "SNK809K1",
      "image_url": "https://...",
      "unit_price": 12900,
      "stock_available": 3,
      "in_stock": true,
      "units_sold": 42
    }
  ],
  "total": 142,
  "page": 1,
  "page_size": 24,
  "facets": {
    "series": [{ "id": "gshock", "label": "G-SHOCK", "count": 450 }],
    "sub_types": [{ "id": "st-digi", "label": "ดิจิทัล / Unisex", "count": 120 }],
    "materials": [{ "id": "D", "label": "สแตนเลส", "count": 80 }],
    "colors": [{ "id": "3", "label": "เขียว", "hex": "#16a34a", "count": 12 }],
    "price_range": { "min": 900, "max": 45000 }
  }
}
```

**Logic:**
1. Query `storefront_products` WHERE `is_published = true` AND `deleted_at IS NULL`
2. **Filter order:** ถ้าไม่มี `q` → `watch_series` (+ `sub_type` ถ้ามี); ถ้ามี `q` → ILIKE บน `model_base`, `sku_name`, `seller_sku`, `product_name` (ข้าม series)
3. `price_min` / `price_max` บน `unit_price` (กรอง SKU ก่อน)
4. **`group_by: product` (default):** dedupe SKU ที่ share `tiktok_product_id` → 1 listing card; pagination นับ listing; `price_min`/`price_max` จาก sibling SKUs; `default_sku_id` = SKU in-stock ถูกสุด
5. `strap_material`, `dial_color`, `sub_type` (ยังใช้ได้ในโหมดค้นหา)
6. **`facets`:** cascading counts จาก filter ปัจจุบัน — **ไม่รวม `q`** ใน facet counts (ยังนับที่ระดับ SKU)
7. Derived columns (`model_base`, `watch_series`, …) เติมตอน `shop-sync-catalog` จาก `sku_name`/`seller_sku`
8. **`units_sold`:** ยอดขายสะสมจาก POS — แสดงบน SKU item / PDP variant; catalog listing card ไม่ส่ง (หรือ v2 aggregate)
9. **ไม่ส่ง** cost_price, pos_product_id

---

### 4.2 `shop-get-product`

**Request:** (อย่างใดอย่างหนึ่ง)
```json
{ "tiktok_sku_id": "1734123456789012345" }
```
```json
{ "tiktok_product_id": "1734098765432109876" }
```

**Response:**
```json
{
  "ok": true,
  "listing": {
    "tiktok_product_id": "1734098765432109876",
    "product_name": "Casio G-Shock GA-2100",
    "description": null,
    "listing_image_url": "https://..."
  },
  "selected_sku_id": "1734123456789012345",
  "skus": [
    {
      "tiktok_sku_id": "1734123456789012345",
      "tiktok_product_id": "1734098765432109876",
      "product_name": "Casio G-Shock GA-2100",
      "sku_name": "GA-2100-1A1",
      "seller_sku": "GA-2100-1A1",
      "image_url": "https://...",
      "unit_price": 4200,
      "stock_available": 3,
      "in_stock": true,
      "units_sold": 58,
      "sales_attributes": [{ "name": "สี", "value_name": "ดำ" }]
    }
  ],
  "product": { "/* selected SKU — same shape as skus[] item; backward compat */" },
  "related": [ "/* listing cards — same shape as catalog group_by:product item */" ]
}
```

**Logic:**
- โหลด sibling SKUs ทั้งหมดที่ share `tiktok_product_id` (published, not deleted)
- `selected_sku_id` จาก request หรือ default = in-stock ถูกสุด
- `related` = listing cards อื่น (ไม่ใช่ SKU สุ่ม) — สูงสุด **10** รายการ
- `listing.listing_image_url` = รูปปก TikTok listing (ใช้ hero PDP; ไม่ใช่รูป variant SKU)
- Cart/checkout ยังใช้ `tiktok_sku_id` จาก SKU ที่เลือก

---

### 4.3 `shop-validate-cart`

**Auth:** optional (guest cart ได้)

**Request:**
```json
{
  "items": [
    {
      "tiktok_sku_id": "1734123456789012345",
      "quantity": 2,
      "expected_unit_price": 12900
    }
  ],
  "coupon_code": null
}
```

**Response — OK:**
```json
{
  "ok": true,
  "valid": true,
  "items": [
    {
      "tiktok_sku_id": "1734123456789012345",
      "quantity": 2,
      "unit_price": 12900,
      "line_total": 25800,
      "stock_available": 3,
      "product_name": "Seiko 5 SNK809",
      "sku_name": "สีเงิน",
      "image_url": "https://..."
    }
  ],
  "subtotal": 25800,
  "shipping_fee": 0,
  "discount": 0,
  "grand_total": 25800,
  "price_changed": false,
  "stock_insufficient": false
}
```

**Response — มีปัญหา:**
```json
{
  "ok": true,
  "valid": false,
  "price_changed": true,
  "stock_insufficient": false,
  "issues": [
    {
      "tiktok_sku_id": "1734123456789012345",
      "type": "price_changed",
      "expected_unit_price": 12900,
      "current_unit_price": 11900,
      "message": "ราคาเปลี่ยนแปลง กรุณายืนยันราคาใหม่"
    }
  ],
  "items": [ /* ค่าล่าสุดจาก server */ ],
  "subtotal": 23800,
  "grand_total": 23800
}
```

**Logic:**
1. โหลดแต่ละ SKU จาก `storefront_products` (หรือ refresh จาก TikTok ถ้า `synced_at` เก่า > 15 นาที)
2. เช็ค `stock_available >= quantity`
3. เช็คราคา vs `expected_unit_price`
4. Apply coupon (Phase 2)

---

### 4.4 `shop-place-order`

**Auth:** customer JWT **หรือ guest (ไม่มี JWT)** — ดู Guest checkout ด้านล่าง

**Request:**
```json
{
  "items": [
    {
      "tiktok_sku_id": "1734123456789012345",
      "quantity": 1,
      "unit_price": 12900
    }
  ],
  "shipping": {
    "recipient_name": "คุณสมชาย ใจดี",
    "phone": "0812345678",
    "address_line": "123/45 ถ.สุขุมวิท",
    "subdistrict": "คลองตัน",
    "district": "วัฒนา",
    "province": "กรุงเทพมหานคร",
    "postal_code": "10110",
    "notes": "โทรก่อนส่ง"
  },
  "save_address": true,
  "address_id": null,
  "payment_method": "transfer",
  "coupon_code": null,
  "slip_storage_path": "payment-slips/uuid/filename.jpg",
  "idempotency_key": "550e8400-e29b-41d4-a716-446655440000"
}
```

`payment_method`: `"cod"` | `"transfer"` — ลูกค้าเลือกเอง  
`transfer` **ต้องมี** `slip_storage_path` จาก `shop-upload-slip` + ผ่าน `shop-verify-slip`  
`shipping_fee`: 0 (ส่งฟรี MVP)

**Response:**
```json
{
  "ok": true,
  "order_id": 12345,
  "web_order_number": "WEB-20260615-0001",
  "status": "pending",
  "grand_total": 12900,
  "message": "สั่งซื้อสำเร็จ ร้านจะยืนยันออเดอร์และแจ้งเมื่อจัดส่ง"
}
```

**Errors (`ok: false`):**
```json
{ "ok": false, "error": "stock_insufficient", "message": "สินค้าบางรายการมีไม่พอ" }
{ "ok": false, "error": "unauthorized", "message": "กรุณาเข้าสู่ระบบ" }
{ "ok": false, "error": "validation_failed", "message": "..." }
```

**Logic:** เรียก RPC `place_web_order(p_payload jsonb)`

**Guest checkout (TIMES_POS — TODO deploy):**
- ไม่มี JWT: สร้าง `sale_orders` ด้วย `customer_user_id = null`, shipping อยู่ใน payload (ไม่ persist `customer_addresses`)
- `save_address` ถูก ignore เสมอเมื่อ guest
- Response shape เหมือน logged-in — ใช้ `location.state` บนหน้า `/order/:id` (guest ไม่เรียก `shop-get-my-orders`)

---

### 4.5 `shop-get-my-orders`

**Auth:** บังคับ

**Request:**
```json
{ "page": 1, "page_size": 20 }
```

**Response:**
```json
{
  "ok": true,
  "orders": [
    {
      "order_id": 12345,
      "web_order_number": "WEB-20260615-0001",
      "status": "pending",
      "status_label": "รอยืนยัน",
      "sale_date": "2026-06-15T10:30:00+07:00",
      "grand_total": 12900,
      "payment_method": "cod",
      "shipping": {
        "recipient_name": "คุณสมชาย ใจดี",
        "phone": "0812345678",
        "address": "123/45 ถ.สุขุมวิท คลองตัน วัฒนา กรุงเทพ 10110"
      },
      "items": [
        {
          "product_name": "Seiko 5 SNK809",
          "sku_name": "สีเงิน",
          "quantity": 1,
          "unit_price": 12900,
          "image_url": "https://..."
        }
      ]
    }
  ],
  "total": 5
}
```

**Logic:** RPC `get_customer_web_orders(p_limit, p_offset)` — filter `customer_user_id = auth.uid()`

---

### 4.6 `shop-upsert-address`

**Auth:** บังคับ

**Request:**
```json
{
  "id": null,
  "label": "บ้าน",
  "recipient_name": "คุณสมชาย",
  "phone": "0812345678",
  "address_line": "123/45",
  "subdistrict": "คลองตัน",
  "district": "วัฒนา",
  "province": "กรุงเทพมหานคร",
  "postal_code": "10110",
  "is_default": true
}
```

**Response:**
```json
{ "ok": true, "address": { "id": "uuid", "...": "..." } }
```

---

### 4.7 `shop-get-payment-info`

**Auth:** optional (public ได้)

**Response:**
```json
{
  "ok": true,
  "shipping_fee": 0,
  "shipping_label": "ส่งฟรี",
  "bank_accounts": [
    {
      "id": "uuid",
      "bank_name": "กสิกรไทย",
      "account_number": "xxx-x-x-xxxx-x",
      "account_name": "TIMES STORE"
    }
  ]
}
```

ถ้ายังไม่มีบัญชี: `bank_accounts: []` + `message: "กรุณาติดต่อร้าน"`

---

### 4.8 `shop-upload-slip`

**Auth:** customer JWT **หรือ guest (ไม่มี JWT)**  
**Content-Type:** `multipart/form-data` — field `file` (JPG/PNG/PDF, max 5MB)

**Response:**
```json
{
  "ok": true,
  "storage_path": "payment-slips/{user_id}/{uuid}.jpg",
  "upload_id": "uuid"
}
```

Guest: `storage_path` = `payment-slips/guest/{uuid}.jpg` (private bucket)

เก็บใน bucket **`payment-slips`** (private) — ไม่ public URL

---

### 4.9 `shop-verify-slip`

**Auth:** customer JWT **หรือ guest (ไม่มี JWT)** — validate ownership ของ `storage_path` ตาม session/guest prefix

**Request:**
```json
{
  "storage_path": "payment-slips/...",
  "expected_amount": 12900,
  "order_draft_id": null
}
```

**Response:**
```json
{
  "ok": true,
  "status": "pending_review",
  "message": "อัปโหลดสลิปสำเร็จ — รอเจ้าหน้าที่ตรวจสอบ"
}
```

**สถานะ `status` (ไม่ใช้ OCR / บริการเสียเงิน):**

| Value | ความหมาย |
|-------|----------|
| `pending_review` | ไฟล์ valid — **รอ admin ตรวจมือ** (default หลัง upload) |
| `approved` | admin อนุมัติใน `/admin` |
| `rejected` | admin ปฏิเสธ (ไฟล์ invalid หรือ admin ตัดสิน) |

**MVP logic (`shop-verify-slip`):**
1. Validate MIME (JPG/PNG/PDF) + size ≤ 5MB
2. ไฟล์ไม่ผ่าน → `{ ok: false, error: "invalid_file" }`
3. ไฟล์ผ่าน → `pending_review` เสมอ — **ไม่พยายาม OCR ยอดเงิน**
4. Admin เปรียบเทียบยอดบนสลิปกับ `grand_total` ด้วยตาใน `/admin`

---

### 4.10 Admin APIs (JWT `admin` | `super_admin`)

| Function | 用途 |
|----------|------|
| `shop-admin-products-list` | รายการ SKU + is_published + deleted_at |
| `shop-admin-product-update` | toggle publish, soft-delete, restore |
| `shop-admin-bank-list` | CRUD บัญชี |
| `shop-admin-bank-upsert` | |
| `shop-admin-bank-delete` | |
| `shop-admin-slips-queue` | คิว `pending_review` |
| `shop-admin-slip-review` | approve / reject + note |

---

### 4.11 `shop-get-promos` (Phase 2)

**Auth:** ไม่บังคับ

**Response:**
```json
{
  "ok": true,
  "banners": [ /* promo_banners active */ ],
  "popup": { /* single active popup or null */ }
}
```

---

### 4.12 `shop-sync-catalog` (internal / cron)

**Auth:** service_role only

- Upsert `storefront_products` จาก TikTok
- `stock_available = tiktok_qty`
- `unit_price` จาก TikTok
- SKU ใหม่: `is_published = true`, `deleted_at = NULL`
- **ไม่** overwrite `is_published` / `deleted_at` ที่ admin ตั้งแล้ว (preserve admin flags)
- หลัง sync (หรือเมื่อ cache เก่า ~6h): เรียก `refresh_storefront_units_sold()` → อัปเดต `units_sold`

---

## 5. Postgres RPCs (ใหม่)

### 5.1 `place_web_order(p_payload jsonb) → jsonb`

**Caller:** Edge Function `shop-place-order` (service_role) หรือ authenticated customer ผ่าน EF

**Behavior:**
1. Verify customer JWT / `customer_user_id`
2. Re-validate cart server-side (ห้าม trust client)
3. Generate `web_order_number` — format `WEB-YYYYMMDD-NNNN`
4. INSERT `sale_orders`:
   - `channel = 'web'`
   - `status = 'pending'`
   - `payment_method` จาก payload (`cod`, `transfer`, ...)
   - `customer_user_id`, shipping columns
   - `buyer_name` = recipient_name
   - `buyer_address` = formatted address
   - money columns จาก validated cart
   - **ไม่** ออก `tax_invoice_no`, **ไม่** ตัดสต็อก
5. INSERT `sale_order_items` พร้อม `tiktok_sku_id`, `product_id` จาก mapping (ถ้ามี)
6. Idempotency: ถ้า `idempotency_key` ซ้ำ → return order เดิม
7. RETURN `{ order_id, web_order_number, status, grand_total }`

### 5.2 `get_customer_web_orders(p_limit, p_offset) → jsonb`

- Filter: `customer_user_id = auth.uid()` AND `channel = 'web'`
- ไม่แสดง `cost_price` ใน items

### 5.3 `get_pending_web_orders(p_limit) → jsonb` (POS)

- Filter: `status = 'pending'` AND `channel = 'web'`
- คล้าย `get_pending_tiktok_orders` — ดู `040_tiktok_pending_confirmation.sql`

### 5.4 `confirm_web_sale_order(...)` (POS)

**Option A (แนะนำ):** ขยาย `confirm_tiktok_sale_order` ให้รองรับ `channel IN ('tiktok', 'web')`  
**Option B:** RPC แยกที่ reuse logic เดียวกัน

Parameters เหมือน TikTok confirm:
- `p_order_id`
- `p_items` (product_id match per line)
- `p_net_received` (optional — web COD อาจใช้ grand_total)
- `p_confirmed_by` = auth.uid()

---

## 6. Backend ที่มีอยู่แล้ว (POS — Shop ห้ามเรียกจาก browser ลูกค้า)

| รายการ | หมายเหตุ |
|--------|----------|
| `import_tiktok_sale_order` | service_role / Edge only |
| `get_pending_tiktok_orders` | POS staff JWT |
| `confirm_tiktok_sale_order` | POS staff JWT |
| `tiktok-products-search` | มี CORS `*` แต่ **Shop ห้ามใช้** — จะ refactor ให้ admin-only |
| `tiktok_tokens` | ห้าม client อ่าน |
| `products` table direct | มี cost_price |
| `sale_orders` table direct | RLS อ่านได้ทั้งร้านถ้า authenticated |

### TikTok catalog shape (อ้างอิง — ใช้ใน sync job)

จาก `flattenProductSkus` ใน `tiktok-client.ts`:

```typescript
{
  tiktok_product_id: string,
  tiktok_sku_id: string,
  seller_sku: string,
  product_name: string,
  quantity: number,
  warehouse_id?: string,
  image_url?: string
}
```

ราคา: จาก TikTok product search response — `sale_price` / `sku_sale_price` (ดู `tiktok-order-import.ts` → `mapLineItem`)

---

## 7. Order status mapping (แสดงลูกค้า)

| DB `sale_orders.status` | แสดงลูกค้า | หมายเหตุ |
|-------------------------|------------|----------|
| `pending` | รอยืนยัน | รอ POS confirm |
| `active` | กำลังจัดเตรียม / จัดส่งแล้ว | แยก sub-status Phase 2 |
| `voided` | ยกเลิก | |

Phase 2: เพิ่ม `web_fulfillment_status` (`paid`, `packing`, `shipped`, `delivered`)

---

## 8. Payment methods

| Value | แสดง | MVP |
|-------|------|-----|
| `cod` | เก็บเงินปลายทาง | ✅ ลูกค้าเลือกได้ |
| `transfer` | โอนเงินผ่านบัญชีธนาคาร | ✅ ลูกค้าเลือกได้ |
| `promptpay` | PromptPay | Phase 2 |
| `card` | บัตรเครดit | Phase 3 (gateway) |

**Checkout:** ลูกค้าเลือก `cod` หรือ `transfer` — **ไม่มี payment method default บังคับ**

**Transfer flow (MVP):**
- Checkout: `shop-get-payment-info` → แสดงบัญชี + ส่งฟรี
- ลูกค้าอัปโหลด: `shop-upload-slip` → `shop-verify-slip`
- `shop-place-order` with `slip_storage_path` + `payment_method: transfer`
- Admin `/admin` อนุมัติสลิปมือ (ไม่มี OCR); POS ดูสลิป signed URL ตอน confirm

DB: `payment_method IN ('cash', 'transfer', 'card', 'paylater', 'cod')`

---

## 9. Channel constraint

DB ปัจจุบัน (`022_harden_sale_order_channel_payment_checks.sql`):

```sql
channel IN ('tiktok', 'shopee', 'facebook', 'store', 'lazada')
```

**Migration ต้องเพิ่ม `'web'`** ก่อน place order ได้

---

## 10. Environment variables (TIMES_SHOP)

```env
VITE_SUPABASE_URL=https://zrymhhkqdcttqsdczfcr.supabase.co
VITE_SUPABASE_ANON_KEY=<from dashboard>
VITE_SHOP_NAME=TIMES STORE
VITE_USE_MOCK_API=true
# GitHub Pages subpath
# vite.config base: '/TIMES_SHOP/'
```

---

## 11. Mock strategy (ระหว่างรอ backend)

Shop สามารถ mock ด้วยไฟล์ `src/mocks/shop-api.js`:

```javascript
export async function mockGetCatalog({ page = 1, page_size = 24 }) {
  return { ok: true, items: [...], total: 10, page, page_size };
}
```

สลับ mock ↔ real ด้วย `VITE_USE_MOCK_API=true`

**Interface ต้องตรง contract นี้เป๊ะ** — เมื่อ backend พร้อมแค่เปลี่ยน adapter

---

## 12. Versioning

| Contract version | Date | Changes |
|------------------|------|---------|
| 1.1.1 | 2026-06-15 | Q13–Q14: admin slip review (no paid OCR), no email confirm |
| 1.1.0 | 2026-06-15 | Q4–Q12: TikTok stock, slip upload, GitHub Pages, etc. |
| 1.0.0 | 2026-06-15 | Initial MVP contract |

เมื่อ breaking change → bump version + update ทั้งสอง repo
