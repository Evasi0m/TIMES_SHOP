# TIMES STORE (TIMES_SHOP)

เว็บร้านค้าสำหรับลูกค้าทั่วไป — แยก repo จาก **TIMES_POS** แต่ใช้ Supabase project เดียวกัน
(`zrymhhkqdcttqsdczfcr`). สร้างด้วย **Vite 5 + React 18 + Tailwind 3**, ภาษา UI หลักเป็นไทย,
mobile-first.

> ข้อกำหนด/สัญญา API อยู่ใน [`docs/times-shop-handoff/`](docs/times-shop-handoff/) — อ่านก่อนแก้ไขฟีเจอร์

## เริ่มต้นใช้งาน

```bash
npm install
cp .env.example .env   # แล้วกรอกค่า (ดูด้านล่าง)
npm run dev            # http://localhost:5173/TIMES_SHOP/
npm run build          # production build -> dist/
npm run preview        # ทดสอบ build
```

## Environment variables

| ตัวแปร | คำอธิบาย |
|--------|----------|
| `VITE_SUPABASE_URL` | URL ของ Supabase (project เดียวกับ POS) |
| `VITE_SUPABASE_ANON_KEY` | **anon key เท่านั้น** — ห้ามใช้ service_role |
| `VITE_SHOP_NAME` | ชื่อร้านที่แสดง (ค่าเริ่มต้น `TIMES STORE`) |
| `VITE_USE_MOCK_API` | `true` = ใช้ mock ใน `src/mocks/`, `false` = เรียก Edge Functions จริง |
| `VITE_GOOGLE_REDIRECT_URL` | redirect ของ Google OAuth (เว้นว่าง = ปิดปุ่ม Google) |

ไฟล์ `.env` ถูก ignore ไว้แล้ว — **ห้าม commit secrets**

## แหล่งข้อมูลสินค้า (สำคัญ)

**สินค้าบนเว็บมาจาก TikTok Shop API เท่านั้น** — ไม่ใช่ตาราง `products` ของ POS

```
TikTok Shop API  →  shop-sync-catalog (TIMES_POS)  →  storefront_products
                                                          ↓
TIMES_SHOP  →  shop-get-catalog  →  แสดง SKU (ราคา/สต็อก TikTok)
```

- ห้ามเรียก `tiktok-products-search` จาก browser ลูกค้า (SECURITY.md)
- ห้าม query `products` / `sale_orders` โดยตรงจาก Shop
- `VITE_USE_MOCK_API=true` ใช้เฉพาะ dev offline — **ไม่ใช่ข้อมูล POS**

## โหมด Mock (dev เท่านั้น)

Backend Edge Functions (`shop-get-catalog`, `shop-sync-catalog`) deploy แล้วบน Supabase  
ตั้ง `VITE_USE_MOCK_API=false` (ค่าเริ่มต้น) + ใส่ anon key ใน `.env`

- Data layer ทั้งหมดผ่าน `src/lib/shop-api.js` เพียงที่เดียว
- `VITE_USE_MOCK_API=true` -> ใช้ `src/mocks/shop-api.mock.js`
- เมื่อ backend พร้อม: ตั้ง `VITE_USE_MOCK_API=false` — **ไม่ต้องแก้หน้า UI**
- ในโหมด mock (และยังไม่ตั้ง anon key) auth จะใช้ session จำลองใน localStorage เพื่อให้ทดสอบ flow ครบได้

## โครงสร้าง

```
src/
  lib/        config, supabase client, shop-api adapter, money, error-map
  mocks/      shop-api.mock.js (ตรงตาม BACKEND_CONTRACT)
  context/    AuthContext, CartContext, ToastContext
  components/ AppLayout, ProductCard, ProtectedRoute, GoogleButton, ...
  pages/      Home, Catalog, Product, Cart, Checkout, OrderSuccess, auth/*, account/*
```

หน้าหลัก: `/`, `/catalog`, `/product/:skuId`, `/cart`, `/checkout`, `/order/:id`,
`/account`, `/account/orders`, `/account/addresses`, `/auth/login`, `/auth/register`

## ตั้งค่า Supabase Dashboard (ต้องทำก่อน production)

1. **Authentication → Providers → Email**: **ปิด "Confirm email"** — ลูกค้าสั่งซื้อได้ทันทีหลัง signup
2. **Google OAuth**: เพิ่ม Client ID/Secret + redirect `https://evasi0m.github.io/TIMES_SHOP/`
   แล้วตั้ง `VITE_GOOGLE_REDIRECT_URL` ให้ตรง (ปุ่ม Google จะ enable อัตโนมัติ)
3. ใส่ `VITE_SUPABASE_ANON_KEY` จาก Settings → API

## Deploy (GitHub Pages + GitHub Actions)

- Workflow: [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) — build แล้ว publish `dist/`
- ตั้ง repo **Settings → Pages → Build and deployment → GitHub Actions**
- ตั้ง repo secrets: `VITE_SUPABASE_ANON_KEY`, `VITE_SUPABASE_URL`, (เมื่อพร้อม) `VITE_USE_MOCK_API=false`, `VITE_GOOGLE_REDIRECT_URL`
- `vite base` = `/TIMES_SHOP/`; `public/404.html` ทำ SPA fallback ให้ deep link ใช้งานได้

## ความปลอดภัย (สรุปจาก SECURITY.md)

- ใช้ **anon key** เท่านั้น — ห้าม service_role ใน frontend
- ห้าม query `products` / `sale_orders` / `sale_order_items` ตรง ๆ — ทุกอย่างผ่าน `shop-*`
- ห้ามเรียก `tiktok-products-search` หรือ Edge Functions ฝั่ง POS
- Re-validate ตะกร้าฝั่ง server (`shop-validate-cart`) ก่อน `shop-place-order` เสมอ
- ส่ง `idempotency_key` ตอน place order กัน double-submit

## รอ Backend (TIMES_POS) — TODO

ฟีเจอร์ทั้งหมดพร้อมต่อ API จริงทันทีที่ deploy ตามนี้ (รายละเอียดใน `BACKEND_TODO.md`):

- Migration `071_web_shop_foundation.sql` (ตารางใหม่ + RLS + trigger role `customer` + ปิด confirm email)
- RPCs: `place_web_order`, `get_customer_web_orders`, `get_pending_web_orders`, confirm flow รองรับ `channel='web'`
- Edge Functions: `shop-get-catalog`, `shop-get-product`, `shop-validate-cart`, `shop-place-order`,
  `shop-get-my-orders`, `shop-upsert-address`, `shop-list-addresses`, `shop-delete-address`,
  `shop-get-payment-info`, `shop-upload-slip`, `shop-verify-slip` + `shop-sync-catalog` (cron)
- Storage bucket `payment-slips` (private)

หมายเหตุ: หน้า Profile (ชื่อที่แสดง/เบอร์) ใช้ `supabase.auth.updateUser` (user metadata)
ยังไม่มี Edge Function สำหรับ profile ใน contract

## Out of scope (MVP)

`/admin/*`, คูปอง, banner/popup (Phase 2); payment gateway (Phase 3); ไม่ copy POS components/migrations
