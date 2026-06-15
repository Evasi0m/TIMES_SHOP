# Prompts สำหรับ AI — TIMES_SHOP & TIMES_POS

> Copy-paste prompts ด้านล่างไปใช้ใน Cursor Agent mode  
> แก้ `[...]` ให้ตรงกับ repo / domain ของคุณก่อนใช้

---

## Prompt ฝั่ง TIMES_SHOP (Frontend — repo ใหม่)

```
คุณกำลังสร้าง repo TIMES_SHOP — เว็บขายสินค้าสำหรับลูกค้าทั่วไป

## อ่านก่อนเริ่ม (บังคับ)
อ่านทุกไฟล์ใน docs/times-shop-handoff/ ตามลำดับ:
1. SHOP_REQUIREMENTS.md — โจทย์และ acceptance criteria
2. BACKEND_CONTRACT.md — API interface (ห้ามออกแบบเองนอก contract)
3. SECURITY.md — กฎห้าม/query ตาราง POS โดยตรง
4. UI_GUIDE.md — design tokens และ layout
5. BACKEND_TODO.md — รู้ว่า API ไหนยังไม่พร้อม (ใช้ mock ได้)

## Backend
- Supabase project เดียวกับ TIMES_POS (ห้ามสร้าง DB ใหม่)
- URL: https://zrymhhkqdcttqsdczfcr.supabase.co
- ใช้ VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY จาก .env
- เรียก API ผ่าน supabase.functions.invoke('shop-*') เท่านั้น
- ห้าม query products / sale_orders โดยตรง
- ห้าม hardcode service_role key

## POS repo (อ้างอิง — ไม่ copy main.jsx)
GitHub: https://github.com/[your-org]/TIMES_POS
อ่านเฉพาะ: tailwind.config.js, src/styles.legacy.css (:root), src/lib/money.js

## Tech stack
- Vite 5 + React 18 + Tailwind 3
- @supabase/supabase-js
- ภาษา UI: ไทย
- Mobile-first

## Mock strategy
ถ้า Edge Functions ยังไม่ deploy:
- สร้าง src/lib/shop-api.js adapter
- สร้าง src/mocks/shop-api.mock.js ตาม BACKEND_CONTRACT response shape เป๊ะ
- สลับด้วย import.meta.env.VITE_USE_MOCK_API=true

## ลำดับ implement (MVP)
Phase A — Scaffold
- [ ] Vite project, Tailwind tokens จาก UI_GUIDE
- [ ] .env.example, .gitignore
- [ ] React Router routes ตาม UI_GUIDE §4.2
- [ ] Layout: header + mobile bottom nav

Phase B — Auth
- [ ] Login / Register (email+password) — **ไม่บังคับ email verification**
- [ ] Supabase: document ว่าต้องปิด Confirm email ใน Dashboard
- [ ] Google OAuth button (Supabase signInWithOAuth) — redirect URL จาก env
- [ ] Auth context + protected routes (/account, /checkout)

Phase C — Catalog
- [ ] Home + /catalog + /product/:skuId
- [ ] shop-get-catalog adapter (mock ก่อน)
- [ ] Product card, PDP, search, pagination

Phase D — Cart & Checkout
- [ ] transfer: upload slip → shop-verify-slip (file check only) → pending_review
- [ ] แสดงข้อความ "รอเจ้าหน้าที่ตรวจสลิป" — ไม่สัญญา OCR อัตโนมัติ
- [ ] Cart context + localStorage
- [ ] /cart + /checkout form (ที่อยู่ครบตาม SHOP_REQUIREMENTS)
- [ ] shop-validate-cart ก่อน submit
- [ ] shop-place-order → หน้า order success
- [ ] จัดการ price_changed / stock_insufficient จาก API

Phase E — Account
- [ ] Profile, addresses (shop-upsert-address mock/real)
- [ ] Order history (shop-get-my-orders)

Phase F — Polish
- [ ] Loading skeletons, empty states, toasts
- [ ] fmtTHB จาก money.js pattern
- [ ] Responsive QA

## ห้ามทำ (MVP)
- ห้าม admin panel จนกว่า MVP ลูกค้าครบ
- ห้าม payment gateway
- ห้าม copy POS components
- ห้ามสร้าง Supabase migrations ใน repo นี้ (backend อยู่ TIMES_POS)

## เมื่อเสร็จแต่ละ phase
- รัน npm run build ให้ผ่าน
- สรุปไฟล์ที่สร้าง + env ที่ต้องตั้ง + TODO ที่รอ backend POS

เริ่มจาก Phase A ได้เลย
```

---

## Prompt ฝั่ง TIMES_POS (Backend)

```
คุณกำลัง implement backend สำหรับ TIMES_SHOP ใน repo TIMES_POS

## อ่านก่อนเริ่ม (บังคับ)
- docs/times-shop-handoff/BACKEND_CONTRACT.md — API spec (ห้ามเปลี่ยน response shape)
- docs/times-shop-handoff/BACKEND_TODO.md — checklist งาน
- docs/times-shop-handoff/SECURITY.md — RLS และ role separation
- docs/TIKTOK_POS_API_REFERENCE.md — TikTok integration ที่มีอยู่
- supabase/functions/_shared/tiktok-client.ts — reuse สำหรับ catalog sync

## เป้าหมาย
ให้ TIMES_SHOP (repo แยก) เรียก Edge Functions + RPC ได้
ออเดอร์ web เข้า POS คิว pending เหมือน TikTok

## ลำดับ implement
1. Migration 071_web_shop_foundation.sql ตาม BACKEND_TODO Phase 0
2. RPCs: place_web_order, get_customer_web_orders, get_pending_web_orders
3. ขยาย confirm flow รองรับ channel='web'
4. Edge Functions: shop-get-catalog, shop-validate-cart, shop-place-order,
   shop-get-my-orders, shop-upsert-address, shop-list-addresses, shop-delete-address
5. shop-sync-catalog + pg_cron
6. POS UI: ขยาย TikTokConfirmPanel แสดง web pending orders
7. Tests: shop-cart validation + RLS customer isolation

## กฎ
- Response shape ตรง BACKEND_CONTRACT v1.0.0
- อย่า break POS workflow เดิม (tiktok, manual sales)
- RLS migration ต้อง test ทุก role: super_admin, admin, visitor, customer
- TikTok tokens ยังคง server-only
- ใช้ pattern เดียวกับ tiktok-products-search (CORS, ok/error in body)

## channel constraint
ต้องเพิ่ม 'web' ใน sale_orders_channel_check ก่อน place order

เริ่มจาก draft migration 071 + place_web_order RPC
```

---

## Prompt ต่อเมื่อ Backend พร้อม (Shop — ต่อ API จริง)

```
Backend TIMES_POS deploy แล้ว — Edge Functions shop-* พร้อมใช้

1. ตั้ง VITE_USE_MOCK_API=false
2. แทน mock adapter ใน src/lib/shop-api.js ด้วย supabase.functions.invoke จริง
3. ทดสอบ flow: login → catalog → cart → checkout → order success
4. ทดสอบ order history
5. ถ้า error แปลด้วย error-map pattern เป็นภาษาไทย

Contract: docs/times-shop-handoff/BACKEND_CONTRACT.md
อย่าเปลี่ยน UI flow — แค่ swap data layer
```

---

## Prompt Phase 2 — Promo & Admin

```
Implement Phase 2 ตาม SHOP_REQUIREMENTS § Phase 2

Backend (TIMES_POS):
- coupons, promo_banners tables + RPC validate_coupon
- shop-get-promos Edge Function
- shop-admin CRUD Edge Functions (admin JWT only)

Frontend (TIMES_SHOP):
- Promo banner top bar + hero
- Popup modal (once per session)
- Coupon input ใน checkout
- /admin route — เช็ค app_role admin/super_admin
- Admin UI ใช้ tiktok-glass.css pattern จาก UI_GUIDE

Security: SECURITY.md — admin routes ต้องเช็ค role ทั้ง client และ Edge Function
```

---

## Prompt สำหรับ Code Review (ใช้ได้ทั้งสอง repo)

```
Review TIMES_SHOP changes against:
- docs/times-shop-handoff/SECURITY.md (hard rules S1–S10)
- docs/times-shop-handoff/BACKEND_CONTRACT.md (API shape)
- docs/times-shop-handoff/SHOP_REQUIREMENTS.md (scope)

รายงาน:
1. Security violations
2. Contract mismatches
3. Scope creep (features นอก MVP)
4. Missing error handling (price_changed, stock_insufficient)
```

---

## วิธีใช้ Prompt กับ AI ให้ได้ผลดี

1. **แนบไฟล์** — ใน Cursor ใช้ `@docs/times-shop-handoff/SHOP_REQUIREMENTS.md` เป็นต้น
2. **ทีละ Phase** — อย่าให้ AI ทำทุกอย่างใน prompt เดียว
3. **ยืนยัน mock vs real** — บอกชัดว่า backend พร้อมหรือยัง
4. **Session แยก** — Shop frontend กับ POS backend ใช้ chat คนละอัน
5. **Review หลัง each phase** — ใช้ prompt Code Review ด้านบน

---

## ข้อมูลที่ต้องเติมใน prompt เอง

ก่อนรัน prompt แรก แก้ค่าเหล่านี้:

```markdown
GitHub TIMES_POS: https://github.com/evasi0m/TIMES_POS
GitHub TIMES_SHOP: https://github.com/evasi0m/TIMES_SHOP
Shop URL: https://evasi0m.github.io/TIMES_SHOP/
POS URL: https://evasi0m.github.io/TIMES_POS/
Deploy: GitHub Pages + GitHub Actions, vite base '/TIMES_SHOP/'

## ตัดสินใจแล้ว (อย่าเปลี่ยน)
- ชื่อร้าน: TIMES STORE (logo ทีหลัง)
- ชำระเงิน: COD + โอน — โอนต้องแนบสลิป · admin ตรวจมือ (ไม่มี OCR)
- Email: ปิด Confirm email — สั่งซื้อได้ทันทีหลัง signup
- บัญชีธนาคาร: admin ตั้งใน /admin (ว่างตอนแรกได้)
- ราคา: TikTok · สต็อก: TikTok qty อย่างเดียว
- จัดส่ง: ส่งฟรี (shipping_fee=0)
- สินค้า: ทุก SKU TikTok · admin เปิด/ปิด/ลบ
- Google Sign-in: UI/code พร้อม · OAuth client config ทีหลัง
- Admin: /admin ใน Shop
```
