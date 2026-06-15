# TIMES_SHOP — UI Guide

> **TIMES STORE** — consumer storefront  
> อ้างอิง design tokens จาก TIMES_POS

---

## 1. Design philosophy

| TIMES_POS | TIMES_SHOP |
|-----------|------------|
| Tool สำหรับพนักงาน — ข้อมูลหนาแน่น | ร้านค้า — เน้นสินค้าและราคา |
| Sidebar nav + modals | Top nav + bottom tab (mobile) |
| Glass UI สำหรับ TikTok admin | Clean catalog + coral CTA |
| Dark mode สำหรับ staff | Light mode เป็นหลัก (dark optional Phase 2) |

---

## 2. Color tokens (copy จาก TIMES_POS)

อ้างอิง `tailwind.config.js` + `src/styles.legacy.css`:

| Token | ใช้กับ | หมายเหตุ |
|-------|--------|----------|
| `primary` / coral | ปุ่ม CTA, ราคา, badge sale | `--c-primary` |
| `canvas` | พื้นหลังหลัก | cream |
| `ink` | หัวข้อ | |
| `body` / `muted` | ข้อความรอง | |
| `surface-card` | การ์ดสินค้า | |
| `hairline` | เส้นแบ่ง | |
| `success` / `error` | สถานะ, validation | |

**TikTok Glass (admin/promo เท่านั้น):** copy `src/styles/tiktok-glass.css`  
Tokens: `--tt-coral`, `--tt-cyan`, touch 44px

### แนะนำ setup Tailwind Shop

```javascript
// tailwind.config.js — โครงเดียวกับ POS
colors: {
  primary: 'rgb(var(--c-primary) / <alpha-value>)',
  ink: 'rgb(var(--c-ink) / <alpha-value>)',
  canvas: 'rgb(var(--c-canvas) / <alpha-value>)',
  // ... copy จาก TIMES_POS/tailwind.config.js
}
```

Copy CSS variables จาก `:root` ใน `src/styles.legacy.css` (เฉพาะ `:root` block แรก — light theme)

---

## 3. Typography

จาก POS:
- **Display / หัวข้อใหญ่:** `font-display` (ถ้า POS ใช้ custom font — copy `@font-face` ที่เกี่ยวข้อง)
- **Body:** system-ui / sans ที่ Tailwind default
- **ราคา:** ตัวหนา, ขนาดใหญ่กว่าชื่อสินค้าเล็กน้อย

---

## 4. Layout — Mobile first

### 4.1 Breakpoints (Tailwind default)

| Breakpoint | Layout |
|------------|--------|
| `< md` | 1 column grid, bottom nav |
| `md+` | 2–3 column grid, top nav |
| `lg+` | max-width container ~1200px |

### 4.2 หน้าหลักที่ต้องมี

```
/                 Home (hero + featured products + promo banner)
/catalog          รายการสินค้า + search
/product/:skuId   รายละเอียดสินค้า
/cart             ตะกร้า
/checkout         ชำระเงิน / ที่อยู่
/order/:id        สั่งซื้อสำเร็จ / รายละเอียด
/account          บัญชี
/account/orders   ประวัติ
/account/addresses ที่อยู่
/auth/login       เข้าสู่ระบบ
/auth/register    สมัคร
/admin/*          admin only (Phase 2)
```

### 4.3 Mobile bottom nav (แนะนำ)

```
[ หน้าแรก ] [ สินค้า ] [ ตะกร้า ] [ บัญชี ]
```

Badge จำนวนบนตะกร้า

---

## 5. Components

### 5.1 Product card

```
┌─────────────────┐
│     [image]     │
│  ชื่อสินค้า      │
│  variant/SKU    │
│  ฿12,900        │
│  [ หมด ] / [+]  │
└─────────────────┘
```

- รูป aspect ratio 1:1 หรือ 4:5
- สินค้าหมด: overlay "สินค้าหมด", ปุ่ม disabled
- Tap → PDP

### 5.2 CTA buttons

| Variant | ใช้ |
|---------|-----|
| Primary coral | "เพิ่มลงตะกร้า", "ยืนยันสั่งซื้อ" |
| Outline | "ดูเพิ่มเติม" |
| Ghost | secondary actions |

Min height **44px** (เดียวกับ TikTok glass toolbar)

### 5.3 Promo banner (Phase 2)

- Top bar: full width, พื้น `ink` ข้อความขาว — แนว `promo-banner` ใน DESIGN_MD
- Popup: modal กลางจอ, ปิดได้, แสดงครั้งเดียวต่อ session (localStorage)

### 5.4 Form (checkout)

- Label ภาษาไทยชัด
- Input ใหญ่พอสำหรับมือถือ (`py-3`, `text-base` — กัน iOS zoom)
- Validation inline สี `error`
- จังหวัด/เขต: dropdown หรือ text (Phase 1 text ได้)

---

## 6. States & feedback

| State | UX |
|-------|-----|
| Loading catalog | skeleton cards |
| Empty cart | illustration + "เลือกซื้อสินค้า" |
| Price changed | banner เตือน + ตาราง before/after |
| Out of stock | แดง, ปุ่ม disabled |
| Order success | checkmark + เลขที่ออเดอร์ + link ประวัติ |
| Error | toast มุมล่าง — ไม่ใช้ `alert()` |

---

## 7. ภาษา

- UI ภาษา**ไทย**เป็นหลัก
- ชื่อสินค้าตาม TikTok (อาจมี EN)
- วันที่: `15 มิ.ย. 2569` หรือ `15/06/2026`
- เงิน: `฿12,900` — ใช้ logic คล้าย `fmtTHB` จาก POS `src/lib/money.js` (copy function ได้)

---

## 8. ไฟล์ POS ที่ควร copy/adapt

| ไฟล์ POS | นำไปใช้ |
|----------|---------|
| `tailwind.config.js` | colors, fonts |
| `src/styles.legacy.css` | `:root` CSS variables |
| `src/lib/money.js` | `fmtTHB`, `roundMoney` |
| `src/lib/error-map.js` | แปล error Supabase เป็นภาษาไทย |
| `src/styles/tiktok-glass.css` | admin promo panel เท่านั้น |
| `src/styles/mobile-shell.css` | แนวคิด safe-area, bottom nav |

**ห้าม copy:** `main.jsx`, POS components, admin dashboards

---

## 9. Accessibility

- ปุ่มมี `aria-label` เมื่อเป็น icon-only
- Focus ring มองเห็นได้
- รูปมี `alt={product_name}`
- Contrast ข้อความบน coral ใช้ `on-primary`

---

## 10. Reference screenshots / mood

- Consumer e-commerce สะอาด อ่านง่าย
- โทน cream อบอุ่น + coral accent (ไม่ใช่ TikTok neon ทั้งหน้า)
- Admin promo zone ใช้ glass ได้ตาม `.cursor/rules/tiktok-glass-ui.mdc` ใน POS

---

## 11. Anti-patterns (อย่าทำ)

- ❌ Sidebar แบบ POS สำหรับลูกค้า
- ❌ แสดง cost / margin / SKU internal ที่ลูกค้าไม่ต้องรู้
- ❌ Table หนาแน่นแบบ POS บนมือถือ
- ❌ Font size < 14px สำหรับ body บน mobile
- ❌ Hardcode สี hex กระจาย — ใช้ tokens
