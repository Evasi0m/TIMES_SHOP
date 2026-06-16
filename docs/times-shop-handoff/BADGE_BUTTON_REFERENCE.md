# TIMES POS — Badge & Sidebar Button Reference

> สรุป UI badge / button จาก TIMES_POS สำหรับ copy ไปใช้โปรเจกตอื่น (เช่น TIMES_SHOP `/admin`)  
> อ้างอิง: `src/styles.legacy.css`, `src/lib/channel-badge-meta.js`, `src/styles.css`  
> สไตล์รวม: **metallic gradient + inset rim + soft glow** (Champagne Luxe family)

---

## สารบัญ

1. [Badge พื้นฐาน](#1-badge-พื้นฐาน)
2. [AI Badge](#2-ai-badge--ai-tab-badge)
3. [Badge "ใหม่"](#3-badge-ใหม่--new-product-badge)
4. [Channel Badge](#4-channel-badge--pill-ช่องทางขาย)
5. [Sidebar Footer Buttons](#5-sidebar-footer-buttons)
6. [ตารางเปรียบเทียบ](#6-ตารางเปรียบเทียบเร็ว)
7. [ไฟล์ที่ copy](#7-ไฟล์ที่-copy-ไปโปรเจกตอื่น)
8. [หมายเหตุ TIMES_SHOP](#8-หมายเหตุสำหรับ-times_shop)

---

## 1. Badge พื้นฐาน

### `.badge-pill` — tag ทั่วไป

| Property | ค่า |
|----------|-----|
| Shape | pill `border-radius: 9999px` |
| Size | `font-size: 12px`, `padding: 4px 12px`, `font-weight: 500` |
| Background | `rgb(var(--c-surface-card) / 0.85)` + `backdrop-filter: blur(8px)` |
| Border | `1px solid rgb(var(--c-surface-strong) / 0.45)` |
| Text | `rgb(var(--c-ink))` |

```css
.badge-pill {
  background: rgb(var(--c-surface-card) / 0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: rgb(var(--c-ink));
  font-size: 12px;
  font-weight: 500;
  padding: 4px 12px;
  border-radius: 9999px;
  display: inline-block;
  white-space: nowrap;
  border: 1px solid rgb(var(--c-surface-strong) / 0.45);
}
```

**Override ด้วย Tailwind** (เช่น badge ในรายการรับสินค้า AI):

```html
<span class="badge-pill !bg-primary/10 !text-primary !px-1.5 !py-0.5 text-[10px] font-semibold flex-shrink-0"
      title="นำเข้าด้วย AI">AI</span>
```

**Variants ที่ใช้บ่อย:**

| Label | Classes |
|-------|---------|
| ของหาย | `badge-pill !bg-warning/15 !text-[#8a6500]` |
| ยกเลิก | `badge-pill !bg-error/10 !text-error` |
| ส่งฟรี | `badge-pill` + tint success (Shop) |

---

### `.badge-coral` — SALE / promo tag

| Property | ค่า |
|----------|-----|
| Shape | pill |
| Background | `linear-gradient(180deg, #d18467, #c06c50)` |
| Text | white, uppercase, `letter-spacing: 1.5px`, `11px` |
| Shadow | coral glow + inset highlight |

```css
.badge-coral {
  background: linear-gradient(180deg, #d18467, #c06c50);
  color: #fff;
  font-size: 11px;
  font-weight: 500;
  padding: 4px 12px;
  border-radius: 9999px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  box-shadow: 0 2px 8px -2px rgba(204, 120, 92, 0.4),
              0 1px 0 rgba(255,255,255,0.25) inset;
}
```

---

## 2. AI Badge — `.ai-tab-badge`

**ใช้ที่:** แท็บ "รับสินค้าจากบริษัท", sidebar nav ที่มี `ai: true`, `KindTabs.jsx`

| Property | ค่า |
|----------|-----|
| Shape | สี่เหลี่ยมมุมมน `border-radius: 4px` |
| Size | `height: 17px`, `padding: 0 6px`, `font-size: 9px`, `font-weight: 800` |
| Text | `AI` — white, `letter-spacing: 0.14em` |
| Gradient | ส้ม → แดง → **ม่วง** |

```css
.ai-tab-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 17px;
  padding: 0 6px;
  margin-right: 1px;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.14em;
  line-height: 1;
  border-radius: 4px;
  color: #fff;
  -webkit-text-fill-color: #fff;
  text-shadow: 0 1px 1px rgba(30, 5, 40, 0.30);
  background:
    radial-gradient(circle at 25% 20%, #fb923c 0%, transparent 60%),
    radial-gradient(circle at 80% 25%, #ef4444 0%, transparent 60%),
    linear-gradient(135deg, #f97316 0%, #dc2626 55%, #7c3aed 100%);
  border: 1px solid rgba(255, 255, 255, 0.22);
  box-shadow:
    0 1px 2px rgba(220, 38, 38, 0.35),
    0 1px 0 rgba(255, 255, 255, 0.30) inset;
  flex-shrink: 0;
}
```

**State — อยู่ใน tab ที่ active** (`.ai-tab-active .ai-tab-badge`):

```css
.ai-tab-active .ai-tab-badge {
  color: #b91c1c;
  -webkit-text-fill-color: #b91c1c;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.95);
  border-color: rgba(255, 255, 255, 0.85);
  box-shadow:
    0 1px 2px rgba(60, 10, 40, 0.25),
    0 1px 0 rgba(255, 255, 255, 0.55) inset;
}
```

**React:**

```jsx
<span className="ai-tab-badge">AI</span>
<span className="ai-tab-badge ml-1.5 align-middle">AI</span>
```

---

## 3. Badge "ใหม่" — `.new-product-badge`

**ใช้ที่:** สินค้าที่สร้างภายใน `NEW_PRODUCT_DAYS` (30 วัน) — catalog, POS search

| Property | ค่า |
|----------|-----|
| Shape/size | **เหมือน `.ai-tab-badge`** แต่ gradient แดงล้วน (ไม่มีม่วง) |
| Text | `ใหม่` — white, `letter-spacing: 0.12em` |

```css
.new-product-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 17px;
  padding: 0 6px;
  margin-right: 1px;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.12em;
  line-height: 1;
  border-radius: 4px;
  color: #fff;
  -webkit-text-fill-color: #fff;
  text-shadow: 0 1px 1px rgba(80, 0, 0, 0.30);
  background:
    radial-gradient(circle at 25% 20%, #fb7185 0%, transparent 60%),
    radial-gradient(circle at 80% 25%, #f97316 0%, transparent 55%),
    linear-gradient(180deg, #ef4444 0%, #dc2626 55%, #b91c1c 100%);
  border: 1px solid rgba(255, 255, 255, 0.30);
  box-shadow:
    0 1px 2px rgba(220, 38, 38, 0.40),
    0 1px 0 rgba(255, 255, 255, 0.35) inset;
  flex-shrink: 0;
  vertical-align: middle;
  user-select: none;
}
```

**Logic (JS):**

```js
const NEW_PRODUCT_DAYS = 30;
const NEW_PRODUCT_WINDOW_MS = NEW_PRODUCT_DAYS * 24 * 60 * 60 * 1000;

const isNewProduct = (p) => {
  const t = p?.created_at ? new Date(p.created_at).getTime() : NaN;
  return Number.isFinite(t) && (Date.now() - t) < NEW_PRODUCT_WINDOW_MS;
};
```

**React:**

```jsx
{isNewProduct(p) && (
  <span className="new-product-badge ml-1.5 align-middle shrink-0">ใหม่</span>
)}
```

---

## 4. Channel Badge — pill ช่องทางขาย

**Component:** `src/components/ui/mobile/ChannelBadge.jsx`  
**Styles:** `channelBadgeStyle()` ใน `src/lib/channel-badge-meta.js`

### Base (ทุก variant)

```js
const base = {
  display: 'inline-block',
  fontSize: '12px',
  fontWeight: 500,
  padding: '4px 12px',
  borderRadius: '9999px',
  whiteSpace: 'nowrap',
  textAlign: 'center',
  minWidth: '80px',
  backdropFilter: 'blur(8px) saturate(140%)',
  WebkitBackdropFilter: 'blur(8px) saturate(140%)',
  lineHeight: 1.4,
};
```

### TikTok API

```js
tiktok_api: {
  background: 'radial-gradient(circle at 12% 10%, rgba(254,44,85,0.38), transparent 38%), radial-gradient(circle at 88% 20%, rgba(255,80,120,0.22), transparent 34%), radial-gradient(circle at 50% 105%, rgba(30,30,30,0.52), transparent 44%), linear-gradient(135deg, rgba(58,28,36,0.94), rgba(28,22,26,0.90))',
  border: '1px solid rgba(254,44,85,0.42)',
  color: '#ffffff',
  boxShadow: '0 1px 0 rgba(255,255,255,0.14) inset, 0 -1px 0 rgba(254,44,85,0.22) inset, 0 4px 14px -4px rgba(254,44,85,0.28)',
}
```

### Shopee

```js
shopee: {
  background: 'radial-gradient(circle at 14% 8%, rgba(255,152,0,0.18), transparent 34%), radial-gradient(circle at 90% 18%, rgba(255,183,77,0.16), transparent 32%), radial-gradient(circle at 50% 105%, rgba(255,243,224,0.50), transparent 44%), linear-gradient(135deg, rgba(255,224,178,0.92), rgba(255,204,128,0.78))',
  border: '1px solid rgba(255,152,0,0.35)',
  color: '#e65100',
  boxShadow: '0 1px 0 rgba(255,255,255,0.85) inset, 0 -1px 0 rgba(255,152,0,0.10) inset, 0 4px 14px -4px rgba(20,20,19,0.08)',
}
```

### Lazada

```js
lazada: {
  background: 'radial-gradient(circle at 14% 8%, rgba(63,81,181,0.18), transparent 34%), radial-gradient(circle at 90% 18%, rgba(121,134,203,0.16), transparent 32%), radial-gradient(circle at 50% 105%, rgba(232,234,246,0.50), transparent 44%), linear-gradient(135deg, rgba(197,202,233,0.92), rgba(159,168,218,0.78))',
  border: '1px solid rgba(63,81,181,0.35)',
  color: '#283593',
  boxShadow: '0 1px 0 rgba(255,255,255,0.85) inset, 0 -1px 0 rgba(63,81,181,0.10) inset, 0 4px 14px -4px rgba(20,20,19,0.08)',
}
```

### TikTok (manual, ไม่ใช่ API)

```js
tiktok: {
  background: 'radial-gradient(circle at 14% 8%, rgba(255,255,255,0.08), transparent 34%), radial-gradient(circle at 90% 18%, rgba(255,64,129,0.12), transparent 32%), radial-gradient(circle at 50% 105%, rgba(30,30,30,0.50), transparent 44%), linear-gradient(135deg, rgba(45,45,45,0.92), rgba(25,25,25,0.88))',
  border: '1px solid rgba(255,255,255,0.18)',
  color: '#ffffff',
  boxShadow: '0 1px 0 rgba(255,255,255,0.15) inset, 0 -1px 0 rgba(0,0,0,0.25) inset, 0 4px 14px -4px rgba(0,0,0,0.20)',
}
```

### หน้าร้าน (store)

```js
store: {
  background: 'radial-gradient(circle at 14% 8%, rgba(76,175,80,0.18), transparent 34%), radial-gradient(circle at 90% 18%, rgba(129,199,132,0.16), transparent 32%), radial-gradient(circle at 50% 105%, rgba(232,245,233,0.50), transparent 44%), linear-gradient(135deg, rgba(200,230,201,0.92), rgba(165,214,167,0.78))',
  border: '1px solid rgba(76,175,80,0.35)',
  color: '#1b5e20',
}
```

**React:**

```jsx
import ChannelBadge from './components/ui/mobile/ChannelBadge.jsx';

<ChannelBadge order={order} />            // text pill
<ChannelBadge order={order} iconOnly />   // icon only
<ChannelBadge channel="shopee" />         // โดยไม่มี order object
```

---

## 5. Sidebar Footer Buttons

สูตรร่วม: **4-stop metallic gradient + inset rim + hover `translateY(-1px)` + active `scale(0.97)`**

| Class | Label | สี | ใช้เมื่อ |
|-------|-------|-----|----------|
| `.btn-patch-log-sidebar` | รายการอัปเดต | ม่วง + Tiffany cyan mesh | ทุก user |
| `.btn-settings-sidebar` | การตั้งค่า user | ทอง metallic | super_admin เท่านั้น |
| `.btn-app-settings-sidebar` | การตั้งค่า | coral/terracotta | ทุก user |
| `.btn-danger-sidebar` | ออกจากระบบ | ruby red | logout |

**Geometry ร่วม:**

```css
/* ทุก variant */
display: inline-flex;
align-items: center;
justify-content: center;
gap: 8px;
width: 100%;
padding: 8px 16px;
min-height: 38px;
border-radius: 10px;
font-weight: 600;
font-size: 14px;
letter-spacing: 0.2px;
cursor: pointer;
transition: all .18s cubic-bezier(.2,.7,.2,1);
```

---

### รายการอัปเดต — `.btn-patch-log-sidebar`

Purple + Tiffany pixel-mesh (มี `::before` gloss + `::after` pixel grid)

```css
.btn-patch-log-sidebar {
  position: relative;
  overflow: hidden;
  color: #f0fdfa;
  text-shadow: 0 1px 0 rgba(15, 60, 55, 0.45);
  border: 1px solid rgba(90, 45, 80, 0.55);
  background:
    radial-gradient(circle at 14% 22%, #c084fc 0%, transparent 52%),
    radial-gradient(circle at 86% 18%, #5eead4 0%, transparent 48%),
    radial-gradient(circle at 52% 108%, #a855f7 0%, transparent 58%),
    radial-gradient(circle at 72% 55%, #0abab5 0%, transparent 42%),
    linear-gradient(135deg, #7c3aed 0%, #5b21b6 42%, #0f766e 100%);
  box-shadow:
    0 2px 8px rgba(91, 33, 182, 0.40),
    0 1px 0 rgba(255, 255, 255, 0.28) inset,
    0 -1px 0 rgba(15, 60, 55, 0.30) inset;
}
.btn-patch-log-sidebar:hover {
  filter: brightness(1.05) saturate(1.03);
  transform: translateY(-1px);
  box-shadow:
    0 6px 16px rgba(91, 33, 182, 0.55),
    0 0 0 1px rgba(180, 255, 240, 0.35),
    0 1px 0 rgba(255, 255, 255, 0.45) inset,
    0 -1px 0 rgba(15, 60, 55, 0.30) inset;
}
.btn-patch-log-sidebar:active { transform: scale(0.97); }
```

**Notification dot** — `.ul-sidebar-badge` (มีอัปเดตใหม่):

```css
.ul-sidebar-badge {
  position: absolute;
  top: 6px;
  right: 8px;
  z-index: 2;
  width: 9px;
  height: 9px;
  border-radius: 999px;
  background: linear-gradient(180deg, #ddd6fe, #5eead4);
  box-shadow: 0 0 0 2px rgba(15, 80, 75, 0.45),
              0 0 10px rgba(10, 186, 181, 0.55);
  pointer-events: none;
}
```

**React:**

```jsx
import UpdateLogButton from './components/ui/UpdateLogButton.jsx';
<UpdateLogButton className="btn-patch-log-sidebar" />
```

---

### การตั้งค่า user — `.btn-settings-sidebar` (ทอง)

```css
.btn-settings-sidebar {
  background: linear-gradient(180deg,
    #f5dc8a 0%, #e2bc55 35%, #c89a2a 65%, #9a7414 100%);
  color: #3a2607;
  text-shadow: 0 1px 0 rgba(255, 240, 200, 0.45);
  border: 1px solid rgba(120, 85, 15, 0.55);
  box-shadow:
    0 2px 8px rgba(160, 110, 10, 0.40),
    0 1px 0 rgba(255, 245, 215, 0.55) inset,
    0 -1px 0 rgba(80, 55, 5, 0.25) inset;
}
.btn-settings-sidebar:hover {
  background: linear-gradient(180deg,
    #fce8a0 0%, #ecc865 35%, #d6a634 65%, #a98018 100%);
  transform: translateY(-1px);
  box-shadow:
    0 6px 16px rgba(180, 130, 10, 0.55),
    0 0 0 1px rgba(255, 220, 130, 0.35),
    0 1px 0 rgba(255, 250, 220, 0.65) inset,
    0 -1px 0 rgba(80, 55, 5, 0.25) inset;
}
.btn-settings-sidebar svg {
  filter: drop-shadow(0 1px 0 rgba(255, 240, 200, 0.5));
}
```

---

### การตั้งค่า — `.btn-app-settings-sidebar` (coral)

```css
.btn-app-settings-sidebar {
  background: linear-gradient(180deg,
    #e8a48a 0%, #cc785c 35%, #a85a3e 65%, #6f3820 100%);
  color: #fff5ec;
  text-shadow: 0 1px 0 rgba(70, 30, 10, 0.50);
  border: 1px solid rgba(90, 45, 20, 0.55);
  box-shadow:
    0 2px 8px rgba(150, 80, 50, 0.40),
    0 1px 0 rgba(255, 225, 200, 0.45) inset,
    0 -1px 0 rgba(70, 30, 10, 0.30) inset;
}
.btn-app-settings-sidebar:hover {
  background: linear-gradient(180deg,
    #f3b89e 0%, #d98a6e 35%, #b76a48 65%, #804226 100%);
  transform: translateY(-1px);
  box-shadow:
    0 6px 16px rgba(180, 90, 50, 0.55),
    0 0 0 1px rgba(255, 180, 140, 0.35),
    0 1px 0 rgba(255, 235, 215, 0.55) inset,
    0 -1px 0 rgba(70, 30, 10, 0.30) inset;
}
.btn-app-settings-sidebar svg {
  filter: drop-shadow(0 1px 0 rgba(255, 215, 190, 0.5));
}
```

---

### ออกจากระบบ — `.btn-danger-sidebar` (ruby red)

```css
.btn-danger-sidebar {
  background: linear-gradient(180deg,
    #f48a8a 0%, #d94343 35%, #a91f1f 65%, #6e0d0d 100%);
  color: #fff5f5;
  text-shadow: 0 1px 0 rgba(60, 5, 5, 0.55);
  border: 1px solid rgba(80, 10, 10, 0.55);
  box-shadow:
    0 2px 8px rgba(150, 25, 25, 0.40),
    0 1px 0 rgba(255, 220, 220, 0.45) inset,
    0 -1px 0 rgba(60, 5, 5, 0.30) inset;
}
.btn-danger-sidebar:hover {
  background: linear-gradient(180deg,
    #ff9c9c 0%, #e85555 35%, #b92828 65%, #7a1414 100%);
  transform: translateY(-1px);
  box-shadow:
    0 6px 16px rgba(180, 30, 30, 0.55),
    0 0 0 1px rgba(255, 140, 140, 0.35),
    0 1px 0 rgba(255, 235, 235, 0.55) inset,
    0 -1px 0 rgba(60, 5, 5, 0.30) inset;
}
.btn-danger-sidebar svg {
  filter: drop-shadow(0 1px 0 rgba(255, 200, 200, 0.45));
}
```

**React (sidebar footer stack):**

```jsx
<div className="sidebar-footer p-4 border-t space-y-2">
  <UpdateLogButton />
  {isSuperAdmin && (
    <button className="btn-settings-sidebar">
      <Icon name="crown" size={16}/> การตั้งค่า user
    </button>
  )}
  <button className="btn-app-settings-sidebar">
    <Icon name="settings" size={16}/> การตั้งค่า
  </button>
  <button className="btn-danger-sidebar">
    <Icon name="logout" size={16}/> ออกจากระบบ
  </button>
</div>
```

---

## 6. ตารางเปรียบเทียบเร็ว

| Component | รูปทรง | Gradient หลัก | Semantic |
|-----------|--------|---------------|----------|
| `.ai-tab-badge` | chip 4px | ส้ม → แดง → ม่วง | AI feature |
| `.new-product-badge` | chip 4px | แดง → ส้ม | สินค้าใหม่ |
| `.badge-coral` | pill | coral POS | SALE / promo |
| `.badge-pill` | pill | cream glass | status ทั่วไป |
| Channel pill | pill | ตาม platform | TikTok / Shopee / Lazada |
| `.btn-patch-log-sidebar` | btn 10px | ม่วง + cyan | รายการอัปเดต |
| `.btn-settings-sidebar` | btn 10px | ทอง | admin user mgmt |
| `.btn-app-settings-sidebar` | btn 10px | coral | settings |
| `.btn-danger-sidebar` | btn 10px | ruby red | logout |

---

## 7. ไฟล์ที่ copy ไปโปรเจกตอื่น

| ไฟล์ POS | เอาไปใช้ |
|----------|----------|
| `src/styles.legacy.css` | `.badge-pill`, `.badge-coral`, `.ai-tab-badge`, `.new-product-badge`, `.btn-*-sidebar` |
| `src/lib/channel-badge-meta.js` | gradient ช่องทางขายทั้งหมด |
| `src/components/ui/mobile/ChannelBadge.jsx` | React wrapper |
| `src/components/ui/UpdateLogButton.jsx` | ปุ่มรายการอัปเดต (optional) |
| `src/styles.css` | `.ul-sidebar-badge`, update log mesh (optional) |

**CSS ที่ต้องมีก่อน:** `:root` tokens จาก `styles.legacy.css` (§ `--c-*`)

---

## 8. หมายเหตุสำหรับ TIMES_SHOP

| ใช้ได้ | ไม่แนะนำ |
|--------|----------|
| `.badge-coral`, `.badge-pill`, `.new-product-badge` บน ProductCard | Sidebar metallic buttons บน consumer pages |
| Channel badges ถ้าแสดงแหล่งสินค้า TikTok | `.ai-tab-badge` บน storefront (POS staff only) |
| `.btn-*-sidebar` ใน `/admin` zone | Copy sidebar footer ทั้ง stack ไป Shop layout |

Consumer storefront ใช้ `ButtonPrimary/Secondary` ตาม [SHOP_DESIGN_SYSTEM.md](./SHOP_DESIGN_SYSTEM.md)  
Admin zone ใช้ TikTok Glass + metallic sidebar buttons ได้ตาม [SHOP_DESIGN_SYSTEM §11](./SHOP_DESIGN_SYSTEM.md#11-admin-zone)

---

*อัปเดต: มิ.ย. 2026 · อ้างอิง TIMES_POS `styles.legacy.css`*
