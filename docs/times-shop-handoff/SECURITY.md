# TIMES_SHOP — Security Guidelines

> กฎความปลอดภัยที่ AI และนักพัฒนา **TIMES_SHOP ต้องปฏิบัติตาม**  
> ฝ่า = ลูกค้าเข้าถึงข้อมูลหลังบ้านร้านได้

---

## 1. หลักการสูงสุด

1. **TIMES_SHOP เป็น untrusted client** — อย่าเชื่อข้อมูลจาก browser (ราคา, สต็อก, role)
2. **Backend เป็น source of truth** — validate ทุกอย่าง server-side ก่อน commit order
3. **แยก surface area** — Shop domain ≠ POS domain ≠ admin tools
4. **Least privilege** — ลูกค้าได้เฉพาะสิ่งที่จำเป็น

---

## 2. สิ่งที่ห้ามทำ (Hard Rules)

| # | ห้าม | เหตุผล |
|---|------|--------|
| S1 | Query `products`, `sale_orders`, `sale_order_items` โดยตรงจาก Shop | RLS ปัจจุบันให้ authenticated อ่านทั้งร้าน |
| S2 | Expose / hardcode `service_role` key ใน Shop | bypass RLS ทั้ง DB |
| S3 | เรียก `tiktok-products-search` จาก browser ลูกค้า | ใช้ TikTok token + เปิด catalog abuse |
| S4 | แสดง `cost_price`, supplier, margin, `net_received` ให้ลูกค้า | ข้อมูลลับร้าน |
| S5 | ให้ลูกค้า signup ได้ role `admin` / `visitor` | privilege escalation |
| S6 | เก็บ role ใน `user_metadata` | ลูกค้าแก้เองได้ |
| S7 | รวม POS routes ใน Shop app (`/pos`, `/dashboard`) | attack surface |
| S8 | ใช้ `confirm_tiktok_sale_order` จาก Shop | staff-only RPC |
| S9 | Trust `unit_price` จาก client ตอน place order | ลูกค้าแก้ราคาใน DevTools |
| S10 | Commit `.env` ที่มี keys | leak secrets |

---

## 3. สิ่งที่ต้องทำ (Required)

| # | ต้องทำ | รายละเอียด |
|---|--------|------------|
| R1 | ใช้ **anon key** เท่านั้นใน Shop | จาก env variable |
| R2 | ทุก business logic ผ่าน **Edge Functions / RPC** | ตาม BACKEND_CONTRACT |
| R3 | Customer role = `customer` ใน `app_metadata` | set โดย server trigger |
| R4 | Re-validate cart server-side ก่อน order | price + stock + coupon |
| R5 | Idempotency key ตอน place order | กัน double-submit |
| R6 | HTTPS เท่านั้น production | |
| R7 | CORS จำกัด Shop domain บน Edge Functions | env `SHOP_ALLOWED_ORIGINS` |
| R8 | Admin routes เช็ค `app_role IN ('admin','super_admin')` | client + server |
| R9 | Log errors ไม่ log PII/token | |
| R10 | `.gitignore` มี `.env`, `.env.local` | |

---

## 4. Auth separation

### 4.1 คนละ "ประเภทผู้ใช้" ในตารางเดียวกัน

Supabase `auth.users` ใช้ร่วมกันได้ **ถ้า** แยก role ชัด:

```
Staff signup (POS)     → app_role: admin | super_admin | visitor  (set by super_admin)
Customer signup (Shop) → app_role: customer                       (set by trigger)
```

### 4.2 กรณี email ซ้ำ

ถ้า `owner@shop.com` เป็น admin POS อยู่แล้ว:
- **ห้าม** signup ซ้ำเป็น customer ด้วย email เดียวกัน
- Shop แสดง "อีเมลนี้ใช้งานแล้ว — กรุณาใช้อีเมลอื่น"

### 4.3 Google OAuth

- Redirect URL แยก Shop vs POS
- หลัง OAuth ครั้งแรก → trigger set role `customer` (ถ้ายังไม่มี role)

---

## 5. Data exposure matrix

| ข้อมูล | ลูกค้า | Staff POS | Edge Function |
|--------|--------|-----------|---------------|
| product_name, image, retail price | ✅ via EF | ✅ | ✅ |
| cost_price | ❌ | ✅ admin | ✅ service |
| TikTok access token | ❌ | ❌ (RPC status only) | ✅ |
| ออเดอร์ตัวเอง | ✅ via EF | — | ✅ |
| ออเดอร์คนอื่น | ❌ | ✅ | ✅ staff |
| shop_settings | ❌ | ✅ admin | ✅ |
| tiktok_product_mappings | ❌ | ✅ admin | ✅ |

---

## 6. RLS target state (หลัง migration)

ปัจจุบัน (POS):

```sql
-- authenticated_read: USING (true)  -- อ่านได้ทุกตาราง
```

เป้าหมาย (หลัง 071 migration):

```sql
-- customer: SELECT sale_orders WHERE customer_user_id = auth.uid()
-- customer: SELECT customer_profiles/addresses WHERE user_id = auth.uid()
-- customer: ไม่มี policy บน products, shop_settings, tiktok_tokens
-- admin/super_admin/visitor: คงเดิม (visitor อ่าน catalog ได้ตาม POS)
```

**Shop ไม่ควรพึ่ง RLS อย่างเดียว** — ใช้ Edge Function เป็น BFF แม้ RLS จะถูกต้อง

---

## 7. Edge Function security

```typescript
// ตัวอย่าง pattern ที่ถูก
const authHeader = req.headers.get('Authorization');
const user = await verifyCustomerJwt(authHeader);
if (!user) return json({ ok: false, error: 'unauthorized' });

// ใช้ service client สำหรับ write
const supa = serviceClient();
await supa.rpc('place_web_order', { p_payload, p_user_id: user.id });
```

```typescript
// ตัวอย่าง pattern ที่ผิด — อย่าทำ
const supa = createClient(url, SERVICE_ROLE_KEY); // ใน Shop frontend!
await supa.from('sale_orders').insert({ ... });   // bypass validation
```

---

## 8. Cart tampering

ลูกค้าสามารถแก้ JavaScript / localStorage ได้เสมอ:

| Client ส่ง | Server ต้อง |
|------------|-------------|
| `unit_price: 1` | โหลดราคาจริงจาก DB/cache |
| `quantity: 999` | เช็ค stock_available |
| SKU ที่ปิดขายแล้ว | reject `is_published = false` |
| coupon หมดอายุ | validate server-side |

---

## 9. Deployment security

| Item | แนะนำ |
|------|-------|
| Shop repo | Private GitHub |
| Supabase anon key | ใส่ env CI/CD — ไม่ secret มาก แต่จำกัด RLS |
| Supabase service_role | **Edge Functions only** — ไม่ใส่ Shop |
| TikTok secrets | **Edge Functions only** — มีอยู่แล้วใน POS |
| Admin panel Shop | ซ่อน URL / ไม่ link จากหน้าร้าน |

---

## 10. Security checklist ก่อน launch

- [ ] Customer ไม่สามารถ `select * from products` ผ่าน Supabase client
- [ ] Customer ไม่เห็น `sale_orders` ของคนอื่น
- [ ] แก้ราคาใน DevTools แล้ว place order → server ใช้ราคาจริง
- [ ] Staff account login Shop → เห็น `/admin` ได้ (ถ้ามี) แต่ไม่เห็น POS
- [ ] Customer login → ไม่มี link/route ไป POS
- [ ] `tiktok-products-search` ไม่ callable โดยไม่มี auth (หลัง harden)
- [ ] CORS ไม่ใช่ `*` ใน production สำหรับ shop-place-order (จำกัด origin)
- [ ] npm audit ไม่มี critical ใน Shop dependencies

---

## 11. Incident response (สั้นๆ)

ถ้าพบลูกค้าเข้าถึง POS data:
1. Rotate Supabase anon key (Dashboard → Settings → API)
2. ตรวจ RLS policies ที่ apply แล้ว
3. ตรวจ JWT `app_role` ของ user ที่รายงาน
4. Disable Shop deploy ชั่วคราวจน fix

---

## 12. เอกสารอ้างอิง POS

- `supabase-migrations/004_rls_policies.sql` — baseline RLS
- `supabase-migrations/005_user_roles.sql` — ทำไมใช้ app_metadata
- `supabase-migrations/014_super_admin_role.sql` — role tiers
