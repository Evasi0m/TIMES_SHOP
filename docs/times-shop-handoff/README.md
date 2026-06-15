# TIMES_SHOP — คู่มือส่งมอบ (Handoff Pack)

> **วัตถุประสงค์:** เอกสารชุดนี้ใช้ส่งต่อให้ AI (หรือนักพัฒนา) ที่สร้าง repo **TIMES_SHOP** ใหม่บน GitHub  
> **Backend:** ใช้ Supabase project เดียวกับ **TIMES_POS** — ห้ามสร้าง database ใหม่  
> **อัปเดต:** มิ.ย. 2026

---

## สารบัญไฟล์ในโฟลเดอร์นี้

| ไฟล์ | ใช้ทำอะไร | ใครอ่าน |
|------|-----------|---------|
| [README.md](./README.md) | ขั้นตอนที่คุณต้องทำ + สิ่งที่ import ให้ AI | **คุณ (เจ้าของโปรเจกต์)** |
| [SHOP_REQUIREMENTS.md](./SHOP_REQUIREMENTS.md) | โจทย์ธุรกิจ / ฟีเจอร์ครบ | AI สร้าง TIMES_SHOP |
| [BACKEND_CONTRACT.md](./BACKEND_CONTRACT.md) | API, schema, RPC, Edge Functions ที่ Shop เรียกได้ | AI ทั้งสอง repo |
| [BACKEND_TODO.md](./BACKEND_TODO.md) | งานที่ต้องทำใน TIMES_POS ก่อน/คู่กัน | AI / คุณ (ฝั่ง POS) |
| [SECURITY.md](./SECURITY.md) | กฎความปลอดภัย — ห้ามทำอะไร | AI สร้าง TIMES_SHOP |
| [UI_GUIDE.md](./UI_GUIDE.md) | Design tokens, UX, responsive | AI สร้าง TIMES_SHOP |
| [PROMPT_INITIAL.md](./PROMPT_INITIAL.md) | Prompt แรก copy-paste ให้ AI repo ใหม่ | **คุณ** |
| [.cursor/rules/times-shop.mdc](./.cursor/rules/times-shop.mdc) | Cursor rule คง scope ตลอด session | copy ไป TIMES_SHOP |

---

## ขั้นตอนที่คุณต้องทำ (Checklist)

### Phase 0 — เตรียมข้อมูล (ทำครั้งเดียว)

- [ ] **1. สร้าง repo GitHub ใหม่** ชื่อ `TIMES_SHOP` (private แนะนำ)
- [ ] **2. Copy โฟลเดอร์นี้ทั้งหมด** ไปที่ `TIMES_SHOP/docs/times-shop-handoff/`  
  รวม `.cursor/rules/times-shop.mdc` → วางที่ `TIMES_SHOP/.cursor/rules/times-shop.mdc`
- [ ] **3. ตั้งค่า Supabase Auth** ใน Dashboard:
  - เปิด Email provider — **ปิด Confirm email** (สมัครแล้วสั่งซื้อได้เลย)
  - เปิด Google OAuth + ใส่ Redirect URL ของ Shop (เช่น `https://shop.example.com/auth/callback`)
  - **อย่า** ใช้ redirect URL ของ POS สำหรับลูกค้า
- [ ] **4. สร้างไฟล์ `.env.example`** ใน TIMES_SHOP (AI จะสร้างให้ก็ได้):

  ```env
  VITE_SUPABASE_URL=https://zrymhhkqdcttqsdczfcr.supabase.co
  VITE_SUPABASE_ANON_KEY=<anon key จาก Supabase Dashboard → Settings → API>
  ```

- [ ] **5. ตัดสินใจครบแล้ว** — ดู [SHOP_REQUIREMENTS.md §12](./SHOP_REQUIREMENTS.md#12-การตัดสินใจแล้ว-ครบ)

### Phase 1 — ส่งงานให้ AI สร้าง TIMES_SHOP (Frontend)

- [ ] **6. เปิด repo TIMES_SHOP ใน Cursor**
- [ ] **7. Import ไฟล์ให้ AI** — ดู [§ ไฟล์ที่ต้อง import ให้ AI](#ไฟล์ที่ต้อง-import-ให้-ai-ตัวใหม่)
- [ ] **8. วาง Prompt** จาก [PROMPT_INITIAL.md](./PROMPT_INITIAL.md) ในแชท Cursor (Agent mode)
- [ ] **9. ให้ AI เริ่มจาก MVP:** scaffold → auth → catalog (mock ได้) → cart → checkout → account

### Phase 2 — ส่งงานให้ AI ทำ Backend ใน TIMES_POS

- [ ] **10. เปิด repo TIMES_POS ใน Cursor (session แยก หรือ agent แยก)**
- [ ] **11. ส่ง prompt ฝั่ง POS** (มีใน [PROMPT_INITIAL.md § Prompt ฝั่ง TIMES_POS](./PROMPT_INITIAL.md#prompt-ฝั่ง-times_pos-backend))
- [ ] **12. ทำตาม [BACKEND_TODO.md](./BACKEND_TODO.md)** — migration, RPC, Edge Functions
- [ ] **13. Deploy Edge Functions ใหม่** บน Supabase หลัง implement

### Phase 3 — เชื่อมต่อ + ทดสอบ

- [ ] **14. เปลี่ยน TIMES_SHOP จาก mock → API จริง** ตาม [BACKEND_CONTRACT.md](./BACKEND_CONTRACT.md)
- [ ] **15. ทดสอบ end-to-end:**
  1. ลูกค้าสมัคร / login บน Shop
  2. ดูสินค้า → ใส่ตะกร้า → checkout
  3. ออเดอร์โผล่ใน POS คิว "รอยืนยัน"
  4. แคชเชียร์ยืนยัน → สต็อกลด → ใบกำกับออก
- [ ] **16. Deploy Shop** (GitHub Pages / Vercel / Cloudflare — ตามที่ตัดสินใจ)

---

## ไฟล์ที่ต้อง import ให้ AI ตัวใหม่

### A. ใน repo TIMES_SHOP (copy ไปแล้วจาก handoff pack)

ให้ AI อ่าน **ทุกไฟล์** ใน `docs/times-shop-handoff/`:

```
docs/times-shop-handoff/
├── README.md
├── SHOP_REQUIREMENTS.md      ← โจทย์หลัก
├── BACKEND_CONTRACT.md       ← API interface
├── BACKEND_TODO.md           ← อะไรยังไม่พร้อม
├── SECURITY.md
├── UI_GUIDE.md
├── PROMPT_INITIAL.md
└── .cursor/rules/times-shop.mdc
```

### B. อ้างอิงจาก repo TIMES_POS (ไม่ต้อง copy ทั้ง repo — ให้ลิงก์ GitHub)

บอก AI ให้ **อ่านจาก TIMES_POS** (clone หรือเปิดใน workspace คู่กัน):

| ไฟล์ใน TIMES_POS | ทำไมต้องอ่าน |
|------------------|--------------|
| `docs/TIKTOK_INTEGRATION.md` | Runbook TikTok + Edge Functions |
| `docs/TIKTOK_POS_API_REFERENCE.md` | สถาปัตยกรรม backend ครบวงจร |
| `docs/TIKTOK_CASHIER_BRIEF.md` | flow ยืนยันออเดอร์ที่ POS |
| `supabase-migrations/040_tiktok_pending_confirmation.sql` | pattern ออเดอร์ `pending` |
| `supabase-migrations/051_tiktok_resync_pending_items.sql` | pattern sync line items |
| `supabase/functions/_shared/tiktok-client.ts` | TikTok catalog API (ใช้ใน Edge Function ใหม่) |
| `supabase/functions/_shared/tiktok-order-import.ts` | map line item จาก TikTok |
| `src/components/pos/TikTokConfirmPanel.jsx` | UI คิวยืนยัน — Shop ต้อง feed เข้านี่ |
| `src/lib/ecommerce-channels.js` | channel rules |
| `tailwind.config.js` + `src/styles.legacy.css` | design tokens |
| `src/styles/tiktok-glass.css` | glass UI (admin/promo ใน Shop) |

### C. ข้อมูลที่คุณต้องให้ AI เอง (ไม่อยู่ใน repo)

| ข้อมูล | ใช้เมื่อ | หมายเหตุ |
|--------|---------|----------|
| Supabase **anon key** | runtime Shop | ใส่ใน `.env` — **ห้าม commit** |
| Google OAuth Client ID/Secret | เปิด Sign in with Google | ตั้งใน Supabase Dashboard |
| Domain deploy Shop | OAuth redirect, CORS | เช่น `shop.timeswatch.co.th` |
| วิธีชำระเงิน MVP | checkout UI | ✅ COD + โอน — ดู SHOP_REQUIREMENTS §11 |
| ข้อมูลบัญชีธนาคาร | หน้าโอนเงิน | ดู SHOP_REQUIREMENTS §12 Q6 |
| โลโก้ / ชื่อร้านที่แสดงบนเว็บ | branding | optional Phase 1 |

**ห้ามให้ AI:** service_role key, TikTok App Secret, webhook secret

---

## สถาปัตยกรรมสรุป (ภาพเดียวจบ)

```
ลูกค้า (Browser)
    │
    ▼
TIMES_SHOP (repo ใหม่ — GitHub)
    │  Supabase Auth (customer JWT)
    │  Edge Functions: shop-get-catalog, shop-validate-cart, shop-place-order
    ▼
Supabase (project เดียวกับ POS)
    │  sale_orders (channel='web', status='pending')
    │  storefront_products (cache จาก TikTok)
    │  customer_profiles, customer_addresses
    ▼
TIMES_POS (repo เดิม)
    │  TikTokConfirmPanel / WebConfirmPanel
    │  confirm_tiktok_sale_order (ขยาย) หรือ confirm_web_sale_order
    ▼
สต็อกลด + ใบกำกับ + Sales History
```

---

## ลำดับงานแนะนำ (กันหลง)

| ลำดับ | ใครทำ | งาน | บล็อกอะไร |
|-------|-------|-----|-----------|
| 1 | คุณ | Copy handoff pack → repo TIMES_SHOP | — |
| 2 | AI (Shop) | Scaffold + UI + mock API | — |
| 3 | AI (POS) | Migration + Edge Functions ตาม BACKEND_TODO | Shop ใช้ API จริง |
| 4 | AI (POS) | ขยายคิว pending รองรับ `channel='web'` | E2E |
| 5 | AI (Shop) | ต่อ API จริง + auth Google | — |
| 6 | คุณ | ทดสอบ E2E + deploy | — |

**Shop สร้าง UI ด้วย mock ได้ก่อน** — แต่ interface ต้องตรง [BACKEND_CONTRACT.md](./BACKEND_CONTRACT.md) เป๊ะ

---

## Prompt สั้น (ถ้าไม่อยากอ่าน PROMPT_INITIAL.md ทั้งไฟล์)

ดู [PROMPT_INITIAL.md](./PROMPT_INITIAL.md) สำหรับ prompt เต็ม  
ด้านล่างคือเวอร์ชันย่อ:

```
สร้าง TIMES_SHOP ตาม docs/times-shop-handoff/SHOP_REQUIREMENTS.md
Backend ตาม BACKEND_CONTRACT.md — ห้าม query ตาราง POS โดยตรง
Security ตาม SECURITY.md — UI ตาม UI_GUIDE.md
ถ้า API ยังไม่มี ให้ mock ตาม contract + TODO ชัดเจน
เริ่ม MVP: Vite+React+Tailwind, auth, catalog, cart, checkout, account
```

---

## คำถาม — ตัดสินใจครบแล้ว ✅

ดู [SHOP_REQUIREMENTS.md §12](./SHOP_REQUIREMENTS.md#12-การตัดสินใจแล้ว-ครบ)

| หัวข้อ | ค่า |
|--------|-----|
| Deploy | https://evasi0m.github.io/TIMES_SHOP/ · GitHub Actions |
| ชื่อร้าน | TIMES STORE |
| ชำระเงิน | COD + โอน (แนบสลิป · admin ตรวจมือ) |
| สลิป | ไม่ใช้ OCR เสียเงิน — admin อนุมัติใน `/admin` |
| Email | ไม่บังคับ confirm ก่อนสั่งซื้อ |
| ราคา / สต็อก | TikTok / TikTok qty อย่างเดียว |
| จัดส่ง | ส่งฟรี |
| สินค้า | ทุก SKU TikTok · admin เปิด/ปิด/ลบ |
| Google | UI พร้อม · OAuth config ทีหลัง |

---

## ลิงก์ repo

| Repo | URL (แก้เป็น GitHub จริงของคุณ) |
|------|----------------------------------|
| TIMES_POS (backend + POS) | https://github.com/evasi0m/TIMES_POS · https://evasi0m.github.io/TIMES_POS/ |
| TIMES_SHOP (ใหม่) | https://github.com/evasi0m/TIMES_SHOP · https://evasi0m.github.io/TIMES_SHOP/ |

Supabase project ref: `zrymhhkqdcttqsdczfcr`
