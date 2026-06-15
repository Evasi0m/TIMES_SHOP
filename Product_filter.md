# Product Filter

เอกสารนี้สรุปวิธีคิดและตรรกะการคัดแยก/ตัวกรองสินค้าของโปรเจกต์ `TIMES_Catalog` เพื่อใช้เป็นแบบแปลนสำหรับย้ายแนวคิดไปใช้กับโปรเจกต์อื่น

อ้างอิงหลักจากไฟล์ `index.html` โดยเฉพาะส่วนข้อมูลสินค้า, search, sort, price filter, CASIO model parser และ advanced filter sheet

## 1. แนวคิดหลักของระบบตัวกรอง

ระบบนี้ไม่ได้พึ่งข้อมูลหมวดหมู่ที่กรอกมาจากฐานข้อมูลโดยตรง แต่ใช้ชื่อรุ่นสินค้าเป็นแหล่งข้อมูลหลัก แล้วค่อย derive หรือถอดความหมายออกมาเป็น attribute สำหรับกรองสินค้า

แนวคิดใหญ่คือ:

1. โหลด raw data จาก Google Apps Script
2. แปลง raw row ให้เป็น product object กลาง
3. เติมข้อมูลที่คำนวณได้จากชื่อรุ่น เช่น series, prefix, material, color
4. เก็บ state ของตัวกรองทั้งหมดไว้แยกกัน
5. เวลากรองสินค้าให้เริ่มจาก `allData` ใหม่ทุกครั้ง
6. Apply filter ตามลำดับที่แน่นอน
7. Sort หลังจากกรองเสร็จ
8. Render เฉพาะผลลัพธ์ที่ผ่านทุกเงื่อนไข

จุดสำคัญคือระบบนี้แยก 3 เรื่องออกจากกัน:

| ส่วน | หน้าที่ |
| --- | --- |
| Classification | ตีความสินค้าว่าอยู่กลุ่มไหน เช่น G-SHOCK, Baby-G, Edifice |
| Filtering | เลือกเฉพาะสินค้าที่ตรงกับ state ปัจจุบัน |
| Rendering | แสดงสินค้าที่ผ่านการกรองแล้ว |

การแยกแบบนี้ทำให้ย้ายไปโปรเจกต์อื่นง่าย เพราะเราสามารถเปลี่ยนกฎ classification โดยไม่ต้องรื้อ UI ทั้งหมด

## 2. โครงสร้างข้อมูลสินค้า

ข้อมูลดิบที่โหลดเข้ามาถูกแปลงด้วย `processRaw()`

```js
allData = rawRows.map((row, i) => ({
  m: String(row.a || ''),
  img: String(row.b || ''),
  rp: parseFloat(row.c) || 0,
  pr: parseFloat(row.f) || 0,
  i: i
})).filter(d => d.m);
```

ความหมายของ field:

| Field | ความหมาย | ใช้ทำอะไร |
| --- | --- | --- |
| `m` | model / ชื่อรุ่นสินค้า | ใช้แสดงผล, search, classification, wishlist |
| `img` | URL รูปสินค้า | ใช้แสดงรูปสินค้า |
| `rp` | retail price / ราคาปกติ | ใช้แสดงราคาเดิมและเป็น fallback ของราคา |
| `pr` | promo price / ราคาขายจริง | ใช้เป็นราคาหลักถ้ามี |
| `i` | index เดิมของข้อมูล | ใช้ sort เพิ่มใหม่ล่าสุด/เก่าสุด |

หลังจากนั้น `enrichData()` จะเติม field ที่ derive เพิ่ม:

| Field | มาจากไหน | ใช้ทำอะไร |
| --- | --- | --- |
| `_mat` | parser จากรหัสรุ่น | filter วัสดุสาย |
| `_color` | parser จากรหัสรุ่น | filter โทนสี |
| `_prefix` | ตัวอักษรนำหน้ารุ่น | filter ประเภทย่อย |

ตัวอย่าง:

```js
{
  m: 'MTP-1302D-7A2',
  img: '...',
  rp: 3500,
  pr: 2990,
  i: 12,
  _mat: 'D',
  _color: '7',
  _prefix: 'MTP'
}
```

## 3. State ที่ใช้ควบคุมตัวกรอง

ตัวกรองทั้งหมดถูกควบคุมด้วย state กลาง:

```js
let allData = [];
let filtered = [];
let sortMode = 0;
let shown = 0;
let query = '';
let activeFilter = 'all';

let pfMin = 0;
let pfMax = 0;

let afMat = '';
let afColor = '';
let subType = '';
```

ความหมาย:

| State | ความหมาย | ค่าเริ่มต้น |
| --- | --- | --- |
| `allData` | สินค้าทั้งหมดหลังแปลงข้อมูลแล้ว | `[]` |
| `filtered` | สินค้าที่ผ่านตัวกรองปัจจุบัน | `[]` |
| `sortMode` | โหมดเรียงลำดับ | `0` |
| `shown` | จำนวนสินค้าที่ render ไปแล้ว | `0` |
| `query` | คำค้นหา | `''` |
| `activeFilter` | series หลัก เช่น all, gshock, babyg | `'all'` |
| `pfMin` | ราคาต่ำสุด | `0` |
| `pfMax` | ราคาสูงสุด | `0` |
| `subType` | ประเภทย่อยของ series | `''` |
| `afMat` | วัสดุสาย | `''` |
| `afColor` | โทนสี | `''` |

แนวคิดสำคัญ:

- `allData` คือ source of truth ห้าม mutate ด้วยการกรองทับ
- `filtered` เป็นผลลัพธ์ชั่วคราวที่คำนวณใหม่ทุกครั้ง
- filter state ต้องแยกจาก product data
- เมื่อ filter เปลี่ยน ให้คำนวณ `filtered` ใหม่จาก `allData` เสมอ

## 4. การคัดแยก Series หลัก

โปรเจกต์นี้แบ่ง series หลักด้วย `seriesRules`

```js
const seriesRules = [
  { id: 'gshock', label: 'G-SHOCK', test: m => /^(G[A-Z]|GW|GM|GBD|GG|GST|GPR|GR|DW-[56789]|DW-H|GMA|MTG|MRG)/i.test(m) },
  { id: 'babyg', label: 'Baby-G', test: m => /^(B[A-Z]|BG[A-Z]|BGD|BGA|BGS|BA-|MSG|SHE)/i.test(m) },
  { id: 'edifice', label: 'Edifice', test: m => /^(EF|EQ[A-Z]|ECB|ERA|EFR|EFS|EFV)/i.test(m) },
  { id: 'protrek', label: 'PRO TREK', test: m => /^(PR[GWJST]|WSD)/i.test(m) },
  { id: 'standard', label: 'CASIO', test: m => true }
];
```

หลักการ:

1. อ่านชื่อรุ่นจากซ้ายไปขวา
2. เอาชื่อรุ่นไปเทียบ regex ทีละ rule
3. rule ที่ match ก่อนเป็นผู้ชนะ
4. ถ้าไม่เข้า rule ใดเลย ให้เป็น `standard`

ฟังก์ชันหลัก:

```js
function getSeries(m) {
  for (const r of seriesRules) {
    if (r.id !== 'standard' && r.test(m)) return r.id;
  }
  return 'standard';
}
```

ตารางการคิด:

| Series | Rule โดยสรุป | ตัวอย่าง prefix | เหตุผล |
| --- | --- | --- | --- |
| G-SHOCK | ขึ้นต้นด้วยกลุ่ม G, DW บางรุ่น, MTG, MRG | `GA`, `GW`, `GM`, `GBD`, `GST`, `DW-5600`, `MTG` | กลุ่มนาฬิกาทนแรงกระแทก |
| Baby-G | ขึ้นต้นด้วย B/BG/BGA/BA/MSG/SHE | `BGA`, `BGD`, `BA`, `MSG`, `SHE` | กลุ่ม Baby-G หรือผู้หญิง |
| Edifice | ขึ้นต้นด้วย EF/EQ/ECB/ERA/EFR/EFS/EFV | `EFR`, `EFV`, `ECB`, `EQB` | กลุ่ม Edifice |
| PRO TREK | ขึ้นต้นด้วย PRG/PRW/PRS/PRT/PRJ หรือ WSD | `PRG`, `PRW`, `WSD` | กลุ่ม Outdoor/Pro Trek |
| CASIO | fallback | อื่น ๆ | กลุ่มมาตรฐาน |

ข้อควรจำเมื่อย้ายไปโปรเจกต์อื่น:

- ลำดับ rule สำคัญมาก เพราะระบบ return rule แรกที่ match
- วาง rule ที่เฉพาะเจาะจงก่อน rule ที่กว้างกว่า
- ควรมี fallback เสมอ เพื่อไม่ให้สินค้าหลุดจากระบบ
- ถ้าฐานข้อมูลมี category ที่เชื่อถือได้ ควรใช้ field จริงก่อน แล้วใช้ regex เป็น fallback

## 5. การแยก Prefix ของสินค้า

ระบบแยก prefix ด้วย regex:

```js
var pm = d.m.match(/^([A-Z]+)/);
d._prefix = pm ? pm[1] : '';
```

ตัวอย่าง:

| Model | `_prefix` |
| --- | --- |
| `GA-2100-1A` | `GA` |
| `MTP-1302D-7A2` | `MTP` |
| `LTP-V007L-9B` | `LTP` |
| `EFR-539D-1A2` | `EFR` |
| `PRW-30-1A` | `PRW` |

prefix นี้ใช้สำหรับคัดแยกประเภทย่อย เช่น G-SHOCK แบบเข็ม+ดิจิทัล, CASIO ผู้ชาย, CASIO ผู้หญิง

## 6. ประเภทย่อยของแต่ละ Series

ประเภทย่อยถูกกำหนดใน `SERIES_SUBS`

```js
var SERIES_SUBS = {
  gshock: [
    { id: 'gs-anadigi', label: 'เข็ม+ดิจิทัล', prefixes: ['GA', 'GMA', 'GBA'] },
    { id: 'gs-digital', label: 'ดิจิทัล', prefixes: ['DW', 'GBD', 'GW', 'GWM'] },
    { id: 'gs-metal', label: 'Metal / G-Steel', prefixes: ['GST', 'GM', 'GMS', 'GMW'] }
  ],
  standard: [
    { id: 'st-men', label: 'ผู้ชาย', prefixes: ['MTP', 'MTD', 'MTS', 'MDV', 'MW', 'AMW', 'MRW', 'MCW', 'HDA', 'HDC', 'AEQ'] },
    { id: 'st-lady', label: 'ผู้หญิง', prefixes: ['LTP', 'LTF', 'LRW', 'LWA'] },
    { id: 'st-digi', label: 'ดิจิทัล / Unisex', prefixes: ['A', 'F', 'MQ', 'W', 'B', 'AE', 'DB', 'LA', 'CA'] }
  ],
  edifice: [
    { id: 'ed-chrono', label: 'Chronograph', prefixes: ['EF', 'EFR', 'EFV', 'EFS', 'EFB'] },
    { id: 'ed-connect', label: 'Connected / Solar', prefixes: ['ECB', 'EQB', 'ERA'] }
  ],
  babyg: [
    { id: 'bg-anadigi', label: 'เข็ม+ดิจิทัล', prefixes: ['BGA', 'BA', 'MSG', 'SHE'] },
    { id: 'bg-digital', label: 'ดิจิทัล', prefixes: ['BGD', 'BGS'] }
  ]
};
```

ฟังก์ชันตรวจประเภทย่อย:

```js
function matchSubType(d, sub) {
  if (!sub) return true;
  return sub.prefixes.some(function(p) {
    return d._prefix === p || d.m.indexOf(p + '-') === 0;
  });
}
```

หลักการ:

- ใช้ `_prefix` เป็นตัวตัดสินหลัก
- ถ้า `_prefix` เท่ากับ prefix ที่กำหนดไว้ ให้ผ่าน
- มี fallback ตรวจว่า model เริ่มด้วย `prefix-` เพื่อรองรับบางรูปแบบ

ตัวอย่าง:

| Model | Series | Prefix | Sub-type |
| --- | --- | --- | --- |
| `GA-2100-1A` | G-SHOCK | `GA` | เข็ม+ดิจิทัล |
| `DW-5600BB-1` | G-SHOCK | `DW` | ดิจิทัล |
| `GST-B400-1A` | G-SHOCK | `GST` | Metal / G-Steel |
| `MTP-1302D-7A2` | CASIO | `MTP` | ผู้ชาย |
| `LTP-V007L-9B` | CASIO | `LTP` | ผู้หญิง |
| `A168WA-1` | CASIO | `A` | ดิจิทัล / Unisex |
| `ECB-2000-1A` | Edifice | `ECB` | Connected / Solar |

## 7. การ parse วัสดุสายจากรหัสรุ่น

วัสดุสายถูกถอดจาก model code ด้วย `parseCasioModel()`

```js
function parseCasioModel(m) {
  if (!m) return { mat: '', color: '' };
  const parts = m.split('-');
  if (parts.length < 2) return { mat: '', color: '' };

  var mat = '';
  var mid = parts[1];
  var matMatch = mid.match(/\d([A-Z]{1,2})$/);
  if (matMatch) mat = matMatch[1];

  var color = '';
  var last = parts[parts.length - 1];
  var cm = last.match(/^([1-9])/);
  if (cm) color = cm[1];

  return { mat: mat, color: color };
}
```

แนวคิดการหา material:

1. แยกชื่อรุ่นด้วย `-`
2. ดูส่วนกลางของชื่อรุ่น เช่น `1302D` จาก `MTP-1302D-7A2`
3. หา pattern ที่เป็นตัวเลขตามด้วยตัวอักษรท้าย segment
4. ตัวอักษรที่ได้คือรหัสวัสดุ
5. ถ้าหาไม่เจอ ให้ fallback เป็น `R` ตอน enrich data

ตัวอย่าง:

| Model | Segment กลาง | Mat code | ความหมาย |
| --- | --- | --- | --- |
| `MTP-1302D-7A2` | `1302D` | `D` | สแตนเลส |
| `LTP-V007L-9B` | `V007L` | `L` | หนัง |
| `MTP-VD01G-1E` | `VD01G` | `G` | ชุบทอง |
| `GA-2100-1A` | `2100` | fallback `R` | เรซิน/ยาง |

Material map:

| Code | ความหมาย |
| --- | --- |
| `R` | เรซิน/ยาง |
| `D` | สแตนเลส |
| `L` | หนัง |
| `G` | ชุบทอง |
| `SG` | สองกษัตริย์ |
| `GL` | ทอง+หนัง |
| `T` | ไทเทเนียม |
| `C` | คอมโพสิต |

ข้อควรระวัง:

- ถ้า parser เจอ code ที่ไม่มีใน `MATERIAL_MAP` ตัวเลือกนั้นจะไม่ถูกแสดงใน filter วัสดุ
- สินค้ายังอยู่ในผลลัพธ์ปกติ แต่ผู้ใช้เลือก filter วัสดุนั้นไม่ได้
- ถ้าจะใช้กับ project อื่น ควรทำ list unknown material codes เพื่อตรวจสอบ

ตัวอย่าง logic เสริมที่ควรมีใน project ถัดไป:

```js
const knownMaterials = new Set(Object.keys(MATERIAL_MAP));
const unknownMaterials = products
  .map(p => p._mat)
  .filter(code => code && !knownMaterials.has(code));
```

## 8. การ parse โทนสีจากรหัสรุ่น

สีถูกถอดจาก segment สุดท้ายของชื่อรุ่น:

```js
var last = parts[parts.length - 1];
var cm = last.match(/^([1-9])/);
if (cm) color = cm[1];
```

หลักการ:

1. แยกรุ่นด้วย `-`
2. ดู segment สุดท้าย เช่น `7A2` จาก `MTP-1302D-7A2`
3. เอาตัวเลขตัวแรก 1-9 เป็นรหัสสี
4. map รหัสสีกับชื่อสีและสี swatch

Color map:

| Code | ชื่อสี | Hex |
| --- | --- | --- |
| `1` | ดำ | `#1d1d1f` |
| `2` | น้ำเงิน | `#2563eb` |
| `3` | เขียว | `#16a34a` |
| `4` | แดง | `#dc2626` |
| `5` | น้ำตาล | `#92400e` |
| `6` | ม่วง | `#7c3aed` |
| `7` | ขาว/เงิน | `#d1d5db` |
| `8` | เทา | `#6b7280` |
| `9` | ทอง/เหลือง | `#d97706` |

ตัวอย่าง:

| Model | Segment สุดท้าย | Color code | สี |
| --- | --- | --- | --- |
| `GA-2100-1A` | `1A` | `1` | ดำ |
| `MTP-1302D-7A2` | `7A2` | `7` | ขาว/เงิน |
| `LTP-V007L-9B` | `9B` | `9` | ทอง/เหลือง |
| `EFR-539D-2A` | `2A` | `2` | น้ำเงิน |

## 9. การ enrich ข้อมูลสินค้า

หลังโหลดสินค้า ระบบเรียก `enrichData()`

```js
function enrichData() {
  allData.forEach(function(d) {
    var p = parseCasioModel(d.m);
    d._mat = p.mat || 'R';
    d._color = p.color;
    var pm = d.m.match(/^([A-Z]+)/);
    d._prefix = pm ? pm[1] : '';
  });
}
```

หน้าที่ของขั้นนี้:

- ทำให้ filter ทำงานเร็วขึ้น เพราะไม่ต้อง parse model ซ้ำทุกครั้ง
- ทำให้ product object มี field พร้อมใช้
- แยก data preparation ออกจาก filter logic

เมื่อนำไปใช้กับโปรเจกต์อื่น ควรมีขั้น enrich แบบเดียวกัน เช่น:

```js
function enrichProduct(product) {
  return {
    ...product,
    _category: classifyCategory(product),
    _subCategory: classifySubCategory(product),
    _brand: normalizeBrand(product.brand),
    _price: getEffectivePrice(product),
    _searchText: buildSearchText(product)
  };
}
```

## 10. ลำดับการกรองจริงใน `applySort()`

หัวใจของระบบอยู่ที่ `applySort()`

ลำดับจริงคือ:

1. clone ข้อมูลจาก `allData`
2. apply series หรือ wishlist เฉพาะตอนที่ไม่ได้ search
3. apply search
4. apply price
5. apply sub-type
6. apply material
7. apply color
8. apply sorting
9. reset `shown` เพื่อให้ render ใหม่จากหน้าแรก

Pseudo code:

```js
function applySort() {
  let d = [...allData];

  if (activeFilter === 'wishlist' && !query) {
    d = d.filter(product => wishlist.includes(product.m));
  } else if (activeFilter !== 'all' && !query) {
    d = d.filter(product => getSeries(product.m) === activeFilter);
  }

  if (query) {
    const exactResults = d.filter(product => exactMatch(product.m, query));
    d = exactResults.length > 0
      ? exactResults
      : allData.filter(product => fuzzyMatch(product.m, query));
  }

  if (pfMin > 0) d = d.filter(product => effectivePrice(product) >= pfMin);
  if (pfMax > 0) d = d.filter(product => effectivePrice(product) <= pfMax);

  if (subType) d = d.filter(product => matchSubType(product, currentSubType));
  if (afMat !== '') d = d.filter(product => product._mat === afMat);
  if (afColor !== '') d = d.filter(product => product._color === afColor);

  d = sortProducts(d, sortMode);

  filtered = d;
  shown = 0;
}
```

เหตุผลที่ควรกรองตามลำดับนี้:

| ลำดับ | เหตุผล |
| --- | --- |
| Series ก่อน | ลดขนาด dataset เมื่อไม่ได้ search |
| Search ก่อน price/facet | ให้ผู้ใช้ค้นหารุ่นได้ตรงก่อน แล้วค่อยบีบด้วยราคา/สี/วัสดุ |
| Price ก่อน hierarchical filters | ใช้เป็น global constraint ที่กระทบ count ของ filter sheet |
| Sub-type ก่อน material/color | เพราะ material/color ควรอิงจากหมวดย่อยที่เลือกแล้ว |
| Sort ท้ายสุด | sort เฉพาะสินค้าที่เหลือจริง |

## 11. พฤติกรรมพิเศษของ Search

Search ในโปรเจกต์นี้ออกแบบให้ค้นหาทั่วทั้ง catalog

จุดสำคัญ:

- ถ้ามี `query` ระบบจะไม่ apply `activeFilter` แบบ series/wishlist ในช่วงแรก
- แปลว่าเลือก G-SHOCK อยู่ แล้วพิมพ์ค้นหา ระบบจะค้นหาจากสินค้าทั้งหมด ไม่จำกัดแค่ G-SHOCK
- แต่ price, subType, material, color ยังมีผลหลัง search

ฟังก์ชัน normalize:

```js
function normalize(s) {
  return s.toLowerCase().replace(/[\s\-_\.]/g, '');
}
```

ผลลัพธ์:

| Input | Normalized |
| --- | --- |
| `GA-2100-1A` | `ga21001a` |
| `ga 2100 1a` | `ga21001a` |
| `GA_2100.1A` | `ga21001a` |

Search มี 2 ชั้น:

### 11.1 Exact match

```js
function exactMatch(model, q) {
  return normalize(model).indexOf(normalize(q)) !== -1;
}
```

เป็น substring search หลัง normalize แล้ว

ตัวอย่าง:

| Query | Model | ผล |
| --- | --- | --- |
| `2100` | `GA-2100-1A` | match |
| `ga2100` | `GA-2100-1A` | match |
| `mtp1302` | `MTP-1302D-7A2` | match |

### 11.2 Fuzzy fallback

ถ้า exact match ไม่มีผลลัพธ์เลย ระบบค่อยใช้ fuzzy search

```js
if (exactResults.length > 0) {
  d = exactResults;
} else {
  d = allData.filter(x => fuzzyMatch(x.m, query));
}
```

Fuzzy รองรับความผิดพลาด 4 แบบ:

| แบบ | ความหมาย |
| --- | --- |
| Substitution | พิมพ์ผิด 1 ตัว เช่น `GA-210O` แทน `GA-2100` |
| Deletion | ผู้ใช้พิมพ์เกิน 1 ตัว แล้วลองลบออก |
| Insertion | ผู้ใช้พิมพ์ขาด 1 ตัว แล้วลองแทนด้วย wildcard |
| Transposition | สลับตัวอักษรติดกัน เช่น `GA-1200` กับ `GA-2100` บางกรณี |

เงื่อนไขสำคัญ:

- query ต้องยาวอย่างน้อย 3 ตัวหลัง normalize
- fuzzy ใช้เฉพาะเมื่อ exact ไม่เจอ
- ช่วยลด false positive จาก query สั้นมาก

Search input มี debounce 200ms:

```js
clearTimeout(debounce);
debounce = setTimeout(() => {
  query = this.value.trim();
  applySort();
  render();
  syncURL();
}, 200);
```

เหตุผล:

- ลดการคำนวณซ้ำขณะผู้ใช้พิมพ์
- ลดการ render ถี่เกินไป
- ทำให้ mobile ลื่นขึ้น

## 12. Price Filter

ระบบราคามี state:

```js
let pfMin = 0;
let pfMax = 0;
```

ราคาที่ใช้กรองคือ:

```js
effectivePrice = product.pr || product.rp;
```

แปลว่า:

- ถ้ามีราคาขายจริง `pr` ให้ใช้ `pr`
- ถ้าไม่มี `pr` ให้ใช้ราคาปกติ `rp`
- ถ้าทั้งสองไม่มี ราคาจะเป็น `0`

Preset ราคา:

```js
const PRICE_PRESETS = [
  { id: 'lt1k', label: '< ฿1,000',      min: 0,     max: 999 },
  { id: '1-5k', label: '฿1,000–5,000',  min: 1000,  max: 5000 },
  { id: '5-10k', label: '฿5,000–10,000', min: 5000,  max: 10000 },
  { id: 'gt10k', label: '฿10,000+',      min: 10000, max: 0 }
];
```

การ apply:

```js
if (pfMin > 0) d = d.filter(x => (x.pr || x.rp) >= pfMin);
if (pfMax > 0) d = d.filter(x => (x.pr || x.rp) <= pfMax);
```

ลักษณะสำคัญ:

- เป็น inclusive range คือรวมค่าขอบด้วย
- ถ้า `pfMin = 0` แปลว่าไม่มีขั้นต่ำ
- ถ้า `pfMax = 0` แปลว่าไม่มีขั้นสูงสุด
- ถ้าผู้ใช้กรอก min มากกว่า max ระบบสลับค่าให้อัตโนมัติ

ตัวอย่าง:

| pfMin | pfMax | ความหมาย |
| --- | --- | --- |
| `0` | `999` | น้อยกว่าหรือเท่ากับ 999 |
| `1000` | `5000` | 1,000 ถึง 5,000 |
| `5000` | `10000` | 5,000 ถึง 10,000 |
| `10000` | `0` | 10,000 ขึ้นไป |

ข้อควรระวัง:

- ช่วง `1,000–5,000` และ `5,000–10,000` ทับกันที่ราคา `5,000`
- ช่วง `5,000–10,000` และ `10,000+` ทับกันที่ราคา `10,000`
- สินค้าที่ไม่มีราคาและมี effective price เป็น `0` อาจติดใน filter `< ฿1,000`
- ถ้าเอาไปใช้จริงใน project อื่น ควรแยก `hasValidPrice` เพื่อกันข้อมูลราคาว่าง

ตัวอย่างที่ robust กว่า:

```js
function getEffectivePrice(product) {
  const price = product.salePrice || product.regularPrice;
  return Number.isFinite(price) && price > 0 ? price : null;
}

function matchPrice(product, min, max) {
  const price = getEffectivePrice(product);
  if (price == null) return false;
  if (min > 0 && price < min) return false;
  if (max > 0 && price > max) return false;
  return true;
}
```

## 13. Advanced Filter Sheet

Advanced filter อยู่ใน FAB sheet และใช้ state ชั่วคราวก่อน apply:

```js
var _tempSeries = '';
var _tempSub = '';
var _tempMat = '';
var _tempColor = '';
```

เมื่อเปิด sheet:

```js
_tempSeries = activeFilter;
_tempSub = subType;
_tempMat = afMat;
_tempColor = afColor;
renderFilterSheet();
```

เมื่อกด apply:

```js
activeFilter = _tempSeries;
subType = _tempSub;
afMat = _tempMat;
afColor = _tempColor;
applySort();
render();
```

แนวคิด UX:

- ผู้ใช้ลองเลือก filter ใน sheet ได้ก่อน
- ผลจริงยังไม่เปลี่ยนจนกด apply
- ปุ่ม apply แสดงจำนวนสินค้าที่จะเจอ
- ถ้าเปลี่ยน filter ชั้นบน ระบบ reset filter ชั้นล่าง

ลำดับชั้นใน sheet:

1. Series
2. Sub-type
3. Material
4. Color

## 14. Cascading Filter

Cascading filter คือ filter ชั้นล่างขึ้นกับ filter ชั้นบน

ตัวอย่าง:

- เลือก `G-SHOCK`
- ระบบแสดง sub-type เฉพาะของ G-SHOCK
- เลือก `เข็ม+ดิจิทัล`
- ระบบนับวัสดุสายเฉพาะสินค้าที่เป็น G-SHOCK + เข็ม+ดิจิทัล
- เลือกวัสดุสาย
- ระบบนับสีเฉพาะสินค้าที่ตรง series + subtype + material

กฎ reset:

| เมื่อเปลี่ยน | Reset อะไร |
| --- | --- |
| Series | Sub-type, material, color |
| Sub-type | Material, color |
| Material | Color |
| Color | ไม่ reset อะไร |

เหตุผล:

- ป้องกัน state ขัดแย้ง เช่นเลือก Baby-G แต่ subType ยังเป็นของ G-SHOCK
- ป้องกัน filter แล้วได้ผลลัพธ์ 0 โดยไม่ตั้งใจ
- ทำให้ count ของตัวเลือกถูกต้อง

ตัวอย่างใน code:

```js
// เลือก series
_tempSeries = 'gshock';
_tempSub = '';
_tempMat = '';
_tempColor = '';
renderFilterSheet();

// เลือก subtype
_tempSub = 'gs-anadigi';
_tempMat = '';
_tempColor = '';
renderFilterSheet();

// เลือก material
_tempMat = 'D';
_tempColor = '';
renderFilterSheet();
```

## 15. การนับจำนวนตัวเลือกใน Filter

ระบบใช้ `getFiltered()` เพื่อคำนวณจำนวนสินค้าในแต่ละตัวเลือก

```js
function getFiltered(series, subId, mat, col) {
  var d = allData;

  if (series && series !== 'all' && series !== 'wishlist') {
    d = d.filter(x => getSeries(x.m) === series);
  }

  if (series === 'wishlist') {
    var wl = getWL();
    d = d.filter(x => wl.indexOf(x.m) !== -1);
  }

  if (subId) {
    var subs = SERIES_SUBS[series] || null;
    if (subs) {
      var sub = subs.find(s => s.id === subId);
      if (sub) d = d.filter(x => matchSubType(x, sub));
    }
  }

  if (mat !== '') d = d.filter(x => x._mat === mat);
  if (col !== '') d = d.filter(x => x._color === col);
  if (pfMin > 0) d = d.filter(x => (x.pr || x.rp) >= pfMin);
  if (pfMax > 0) d = d.filter(x => (x.pr || x.rp) <= pfMax);

  return d;
}
```

สิ่งที่ `getFiltered()` ใช้:

- series
- wishlist
- sub-type
- material
- color
- price

สิ่งที่ `getFiltered()` ไม่ใช้:

- search query
- sort mode
- pagination / infinite scroll

เหตุผล:

- ใช้สำหรับนับจำนวน filter options ไม่ใช่แสดงผลสุดท้าย
- search เป็นอีก mode หนึ่ง ไม่ควรทำให้ filter sheet เปลี่ยนไปมาตามตัวอักษรที่กำลังพิมพ์
- sort ไม่กระทบจำนวนสินค้า
- pagination ไม่เกี่ยวกับจำนวนทั้งหมด

## 16. วิธี render ตัวเลือกแบบ dynamic

Series:

- นับจำนวนสินค้าทุก series จาก `allData`
- แสดงเฉพาะ series ที่มีสินค้า
- แสดง wishlist เฉพาะเมื่อมีสินค้าถูกใจอย่างน้อย 1 รายการ

Sub-type:

- แสดงเฉพาะเมื่อ series นั้นมี definition ใน `SERIES_SUBS`
- แสดงเฉพาะ sub-type ที่ count มากกว่า 0

Material:

- คำนวณจากสินค้าที่ผ่าน series + subtype + price
- แสดงเฉพาะ material ที่มีมากกว่า 0
- sort material ตามจำนวนสินค้าจากมากไปน้อย
- ถ้ามี material option ไม่เกิน 1 แบบ จะไม่แสดง section วัสดุ

Color:

- คำนวณจากสินค้าที่ผ่าน series + subtype + material + price
- แสดงเฉพาะสีที่มี count มากกว่า 0
- เรียงตามรหัสสี 1 ถึง 9

หลักคิด:

- อย่าแสดงตัวเลือกที่กดแล้วไม่มีสินค้า
- จำนวนสินค้าบน chip ต้อง reflect filter ที่เลือกก่อนหน้า
- filter ชั้นล่างต้องแคบลงตาม filter ชั้นบน

## 17. Wishlist เป็น Filter พิเศษ

Wishlist เก็บเป็น array ของ model ใน `localStorage`

```js
const WL_KEY = 'wl';

function getWL() {
  try {
    return JSON.parse(localStorage.getItem(WL_KEY)) || [];
  } catch (e) {
    return [];
  }
}
```

เวลา filter:

```js
if (activeFilter === 'wishlist' && !query) {
  const wl = getWL();
  d = d.filter(x => wl.indexOf(x.m) !== -1);
}
```

ลักษณะ:

- wishlist ถือเป็น series แบบพิเศษ
- แสดงใน advanced filter เฉพาะเมื่อมีรายการโปรด
- เมื่อ search อยู่ wishlist filter จะไม่ถูก apply ในช่วง series filter
- ใช้ model string เป็น key ดังนั้นถ้าชื่อรุ่นเปลี่ยน wishlist เดิมอาจหาไม่เจอ

ถ้าจะทำให้ robust ในโปรเจกต์อื่น ควรใช้ stable product id แทน model name:

```js
wishlistIds.includes(product.id)
```

## 18. Sorting

Sort mode:

```js
const sortOpts = [
  { label: 'เพิ่มใหม่ล่าสุด' },
  { label: 'เก่าสุด' },
  { label: 'ราคาต่ำ -> สูง' },
  { label: 'ราคาสูง -> ต่ำ' },
  { label: 'A-Z / ก-ฮ' }
];
```

Logic:

```js
switch (sortMode) {
  case 0:
    d.sort((a, b) => b.i - a.i);
    break;
  case 1:
    d.sort((a, b) => a.i - b.i);
    break;
  case 2:
    d.sort((a, b) => (a.pr || a.rp) - (b.pr || b.rp));
    break;
  case 3:
    d.sort((a, b) => (b.pr || b.rp) - (a.pr || a.rp));
    break;
  case 4:
    d.sort((a, b) => a.m.localeCompare(b.m));
    break;
}
```

ความหมาย:

| sortMode | ความหมาย | ใช้ field |
| --- | --- | --- |
| `0` | เพิ่มใหม่ล่าสุด | `i` มากไปน้อย |
| `1` | เก่าสุด | `i` น้อยไปมาก |
| `2` | ราคาต่ำไปสูง | `pr || rp` |
| `3` | ราคาสูงไปต่ำ | `pr || rp` |
| `4` | ชื่อรุ่น A-Z / ก-ฮ | `m.localeCompare()` |

ข้อควรจำ:

- sort ควรเกิดหลัง filter เสมอ
- ถ้าข้อมูลมี createdAt จริง ควรใช้วันที่แทน index
- ถ้าราคาอาจว่าง ควรกำหนดว่าจะให้สินค้าราคาไม่ครบไปอยู่ท้ายหรือถูกตัดออก

## 19. URL Sync / Deep Link ของ Filter

ระบบ sync filter state เข้า query string:

```js
if (query) params.set('q', query);
if (activeFilter && activeFilter !== 'all') params.set('filter', activeFilter);
if (pfMin) params.set('min', pfMin);
if (pfMax) params.set('max', pfMax);
if (subType) params.set('sub', subType);
if (afMat) params.set('mat', afMat);
if (afColor) params.set('color', afColor);
if (sortMode > 0) params.set('sort', sortMode);
```

ค่าที่ sync:

| URL param | State |
| --- | --- |
| `q` | `query` |
| `filter` | `activeFilter` |
| `min` | `pfMin` |
| `max` | `pfMax` |
| `sub` | `subType` |
| `mat` | `afMat` |
| `color` | `afColor` |
| `sort` | `sortMode` |

ประโยชน์:

- refresh หน้าแล้ว filter ยังอยู่
- share link พร้อม filter ได้
- เปิด product detail ด้วย hash ต่อท้าย URL ได้

ข้อควรทำเพิ่มในโปรเจกต์อื่น:

- validate URL params ก่อนเอาเข้า state
- ถ้า param ไม่อยู่ใน allowed values ให้ ignore
- ถ้า `min > max` ให้ normalize เช่นเดียวกับ input ปกติ

## 20. Pagination / Infinite Scroll

โปรเจกต์นี้ไม่ได้ render สินค้าทั้งหมดทันทีเมื่อไม่ได้ search

```js
const BATCH = 50;
```

เวลา render:

- ถ้า search อยู่ จะแสดงผลลัพธ์ทั้งหมด
- ถ้าไม่ได้ search จะแสดงทีละ 50 รายการ
- scroll ใกล้ท้ายหน้าแล้วค่อย `loadMore()`

หลักคิด:

- filter คำนวณ `filtered` ทั้งหมดก่อน
- pagination คุมเฉพาะจำนวนที่ render
- อย่าเอา pagination ไปปนกับ filter logic

## 21. Empty State

ถ้า search แล้วไม่เจอสินค้า:

- แสดงข้อความไม่พบสินค้า
- แสดง query ที่ผู้ใช้ค้นหา
- เสนอช่องทางสอบถาม Messenger

ใน code เงื่อนไขคือ:

```js
if (filtered.length === 0 && isSearch) {
  renderEmptySearchState();
}
```

ข้อสังเกต:

- empty state ถูกออกแบบมาสำหรับ search เป็นหลัก
- ถ้า filter ปกติแล้วไม่เจอ อาจยังไม่มี empty state เฉพาะ
- ใน project ถัดไปควรมี empty state สำหรับทุกกรณี เช่น search ไม่เจอ, filter แคบเกินไป, สินค้าหมด

## 22. หลักการออกแบบ Filter ที่นำไปใช้กับ Project อื่น

เมื่อต้องย้ายแนวคิดนี้ไป project อื่น ให้คิดเป็น 7 ชั้น

### ชั้นที่ 1: Raw Data

รับข้อมูลจาก backend, sheet, database หรือ API

ตัวอย่าง:

```js
{
  sku: 'MTP-1302D-7A2',
  name: 'Casio MTP-1302D-7A2',
  imageUrl: '...',
  regularPrice: 3500,
  salePrice: 2990
}
```

### ชั้นที่ 2: Normalize

แปลง field ให้เป็นรูปแบบกลางที่ frontend ใช้เสมอ

```js
{
  id: '...',
  model: 'MTP-1302D-7A2',
  image: '...',
  price: 2990,
  retailPrice: 3500,
  sourceIndex: 12
}
```

### ชั้นที่ 3: Enrich

เติม field สำหรับ filter

```js
{
  ...product,
  _series: 'standard',
  _subType: 'st-men',
  _material: 'D',
  _color: '7',
  _prefix: 'MTP',
  _searchText: 'mtp1302d7a2 casiomtp1302d7a2'
}
```

### ชั้นที่ 4: Filter State

แยก filter state ออกจาก product

```js
{
  query: '',
  series: 'all',
  subType: '',
  material: '',
  color: '',
  minPrice: 0,
  maxPrice: 0,
  sort: 'newest'
}
```

### ชั้นที่ 5: Filter Engine

เขียน function pure ที่รับ product list + state แล้วคืน list ใหม่

```js
function filterProducts(products, state) {
  let result = [...products];

  result = applySeries(result, state);
  result = applySearch(result, state);
  result = applyPrice(result, state);
  result = applyFacets(result, state);
  result = applySort(result, state);

  return result;
}
```

### ชั้นที่ 6: Facet Counts

นับจำนวนของตัวเลือกจาก context ปัจจุบัน

```js
function getFacetCounts(products, state, facetName) {
  const stateWithoutCurrentFacet = removeFacet(state, facetName);
  const base = filterProducts(products, stateWithoutCurrentFacet);
  return countBy(base, facetName);
}
```

### ชั้นที่ 7: UI

UI ควรอ่านจาก state และ counts เท่านั้น

- ปุ่ม active ดูจาก state
- จำนวนสินค้าดูจาก count function
- การ reset filter ทำใน state transition
- การ apply filter เรียก filter engine

## 23. ตัวอย่าง Generic Filter Engine

ตัวอย่างสำหรับ project ใหม่:

```js
function getEffectivePrice(product) {
  return product.salePrice || product.regularPrice || 0;
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[\s\-_\.]/g, '');
}

function filterProducts(products, state) {
  let result = [...products];

  if (!state.query && state.category && state.category !== 'all') {
    result = result.filter(p => p._category === state.category);
  }

  if (state.query) {
    const q = normalizeText(state.query);
    const exact = result.filter(p => normalizeText(p.model).includes(q));
    result = exact.length > 0
      ? exact
      : products.filter(p => fuzzyMatch(p.model, state.query));
  }

  if (state.minPrice > 0) {
    result = result.filter(p => getEffectivePrice(p) >= state.minPrice);
  }

  if (state.maxPrice > 0) {
    result = result.filter(p => getEffectivePrice(p) <= state.maxPrice);
  }

  if (state.subType) {
    result = result.filter(p => p._subType === state.subType);
  }

  if (state.material) {
    result = result.filter(p => p._material === state.material);
  }

  if (state.color) {
    result = result.filter(p => p._color === state.color);
  }

  return sortProducts(result, state.sort);
}
```

## 24. ตัวอย่าง Generic Classification สำหรับ Project อื่น

ถ้า project อื่นมีสินค้าไม่ใช่นาฬิกา ให้เปลี่ยนจาก CASIO model parser เป็น rule ของ domain นั้น

ตัวอย่างสินค้าแฟชั่น:

```js
const categoryRules = [
  { id: 'shirt', label: 'เสื้อ', test: p => /shirt|tee|t-shirt/i.test(p.name) },
  { id: 'pants', label: 'กางเกง', test: p => /pants|jeans|trousers/i.test(p.name) },
  { id: 'shoes', label: 'รองเท้า', test: p => /shoe|sneaker|boot/i.test(p.name) },
  { id: 'accessory', label: 'เครื่องประดับ', test: p => true }
];

function classifyCategory(product) {
  return categoryRules.find(rule => rule.test(product))?.id || 'accessory';
}
```

ตัวอย่างสินค้า electronics:

```js
const categoryRules = [
  { id: 'phone', label: 'มือถือ', test: p => /iphone|galaxy|pixel|phone/i.test(p.name) },
  { id: 'tablet', label: 'แท็บเล็ต', test: p => /ipad|tablet|tab/i.test(p.name) },
  { id: 'laptop', label: 'แล็ปท็อป', test: p => /macbook|notebook|laptop/i.test(p.name) },
  { id: 'accessory', label: 'อุปกรณ์เสริม', test: p => true }
];
```

หลักคิด:

- อย่ายึด code CASIO ตรง ๆ ถ้า domain เปลี่ยน
- ยึด pattern "derive attribute จากข้อมูลที่มี" แทน
- ถ้ามี field ชัดเจนจาก backend ให้ใช้ field นั้นก่อน
- regex เหมาะกับ fallback หรือข้อมูลที่มี naming convention แข็งแรง

## 25. การออกแบบ Filter Taxonomy

ก่อนเขียน code filter ควรออกแบบ taxonomy ก่อน

ตัวอย่าง taxonomy ของโปรเจกต์นี้:

```text
All Products
├── Wishlist
├── G-SHOCK
│   ├── เข็ม+ดิจิทัล
│   ├── ดิจิทัล
│   └── Metal / G-Steel
├── Baby-G
│   ├── เข็ม+ดิจิทัล
│   └── ดิจิทัล
├── Edifice
│   ├── Chronograph
│   └── Connected / Solar
├── PRO TREK
└── CASIO
    ├── ผู้ชาย
    ├── ผู้หญิง
    └── ดิจิทัล / Unisex

Facets:
- Price
- Material
- Color
```

แยก filter เป็น 3 ประเภท:

| ประเภท | ตัวอย่าง | พฤติกรรม |
| --- | --- | --- |
| Primary category | Series | เลือกแล้ว reset ชั้นล่าง |
| Hierarchical subcategory | Sub-type | ขึ้นกับ category |
| Facet | Material, color, price | ใช้บีบผลลัพธ์ใน category/subcategory |

ข้อแนะนำ:

- Category ควรเป็นสิ่งที่ผู้ใช้เข้าใจง่าย
- Subcategory ควรปรากฏเฉพาะเมื่อ category นั้นมีจริง
- Facet ควร dynamic ตามสินค้าที่เหลือ
- อย่าให้ผู้ใช้กดตัวเลือกที่นำไปสู่ 0 รายการ ถ้าเลี่ยงได้

## 26. การจัดการ Active State และ Badge

Advanced filter badge นับเฉพาะ:

```js
if (activeFilter !== 'all') cnt++;
if (subType) cnt++;
if (afMat !== '') cnt++;
if (afColor !== '') cnt++;
```

ข้อสังเกต:

- price ไม่ถูกนับใน badge ของ advanced filter
- price แสดง active ผ่าน chips และ price button แยกต่างหาก

หลักคิด:

- ถ้า filter ถูกควบคุมคนละ UI ควรแสดง active state ใน UI นั้น
- badge ควรบอกจำนวน filter ที่อยู่ในกลุ่มเดียวกัน
- อย่าให้ badge นับรวมทุกอย่างจนผู้ใช้ไม่รู้ว่า active อยู่ตรงไหน

## 27. Clear Filter

มี clear หลายระดับ:

| Action | Reset |
| --- | --- |
| clear price | `pfMin = 0`, `pfMax = 0` |
| clear advanced filter ใน sheet | `_tempSeries = 'all'`, `_tempSub = ''`, `_tempMat = ''`, `_tempColor = ''` |
| goHome | reset query, series, subtype, material, color, price |
| เปลี่ยน series | reset subtype, material, color |
| เปลี่ยน subtype | reset material, color |
| เปลี่ยน material | reset color |

หลักคิด:

- Clear ต้องชัดว่าล้างระดับไหน
- Parent filter เปลี่ยนต้องล้าง child filter
- Home/reset all ควรคืนระบบไปค่า default ทั้งหมด

## 28. Known Limitations ของระบบปัจจุบัน

สิ่งที่ควรรู้ก่อนนำ logic ไปใช้ต่อ:

1. ระบบพึ่งพาชื่อรุ่นสูงมาก ถ้าชื่อรุ่นกรอกผิด category/material/color จะผิด
2. Material parser อาจเจอ code ที่ไม่มีใน `MATERIAL_MAP`
3. สินค้าราคา `0` อาจผ่าน price filter บางช่วง
4. Search ข้าม series filter เมื่อมี query ซึ่งเป็น UX choice ไม่ใช่ bug
5. Price preset มี boundary ซ้ำที่ 5,000 และ 10,000
6. Filter count ใน sheet ไม่อิง search query
7. Wishlist ใช้ model name เป็น key ไม่ใช่ stable product id
8. Sort ใหม่ล่าสุดใช้ index จากแหล่งข้อมูล ไม่ใช่วันที่เพิ่มสินค้า
9. Fuzzy search อาจมี false positive ถ้ารหัสรุ่นคล้ายกันมาก
10. PRO TREK ไม่มี sub-type definition ใน `SERIES_SUBS` จึงไม่มีประเภทย่อยใน sheet

## 29. Checklist สำหรับย้ายไป Project ใหม่

ก่อนเริ่ม:

- ระบุ source of truth ของสินค้า
- ระบุ field ที่เชื่อถือได้ เช่น category, brand, price, stock
- ระบุ field ที่ต้อง derive เช่น prefix, model family, color code
- เขียน product schema กลาง
- เขียน taxonomy ก่อนเขียน UI

ตอนเขียน logic:

- สร้าง `normalizeProduct()`
- สร้าง `enrichProduct()`
- สร้าง `classifyCategory()`
- สร้าง `classifySubType()`
- สร้าง `getEffectivePrice()`
- สร้าง `filterProducts()`
- สร้าง `sortProducts()`
- สร้าง `getFacetCounts()`
- สร้าง `syncURL()` และ `readURL()` ถ้าต้อง share link

ตอนทดสอบ:

- สินค้าทุกชิ้นต้องอยู่ใน category ใด category หนึ่ง
- ผลรวม count ของ series ต้องเท่ากับจำนวนสินค้าทั้งหมด
- เลือก parent แล้ว child filter ต้อง reset
- price min/max ต้องกรองถูก
- กรอก min > max ต้อง normalize หรือแจ้ง error
- search exact ต้องมาก่อน fuzzy
- search query สั้นเกินไปไม่ควร fuzzy
- reload URL พร้อม filter แล้ว state ต้องกลับมาถูก
- สินค้าราคาว่างต้องไม่ทำให้ผลลัพธ์ผิด
- unknown category/material/color ต้องถูก log เพื่อตรวจสอบ

## 30. Test Cases แนะนำ

### Series classification

| Model | Expected series |
| --- | --- |
| `GA-2100-1A` | `gshock` |
| `DW-5600BB-1` | `gshock` |
| `BGA-290-7A` | `babyg` |
| `EFR-539D-1A2` | `edifice` |
| `PRW-30-1A` | `protrek` |
| `MTP-1302D-7A2` | `standard` |

### Sub-type classification

| Model | Expected sub-type |
| --- | --- |
| `GA-2100-1A` | `gs-anadigi` |
| `DW-5600BB-1` | `gs-digital` |
| `GST-B400-1A` | `gs-metal` |
| `MTP-1302D-7A2` | `st-men` |
| `LTP-V007L-9B` | `st-lady` |
| `A168WA-1` | `st-digi` |

### Material parsing

| Model | Expected material |
| --- | --- |
| `MTP-1302D-7A2` | `D` |
| `LTP-V007L-9B` | `L` |
| `MTP-VD01G-1E` | `G` |
| `GA-2100-1A` | fallback `R` |

### Color parsing

| Model | Expected color |
| --- | --- |
| `GA-2100-1A` | `1` |
| `EFR-539D-2A` | `2` |
| `MTP-1302D-7A2` | `7` |
| `LTP-V007L-9B` | `9` |

### Price filtering

| Price | Filter | Expected |
| --- | --- | --- |
| `999` | `< ฿1,000` | pass |
| `1000` | `฿1,000–5,000` | pass |
| `5000` | `฿1,000–5,000` | pass |
| `5000` | `฿5,000–10,000` | pass |
| `10000` | `฿5,000–10,000` | pass |
| `10000` | `฿10,000+` | pass |

## 31. โครงสร้างไฟล์ที่แนะนำสำหรับ Project ถัดไป

ถ้าจะ refactor ออกจากไฟล์ HTML ใหญ่ ควรแยกประมาณนี้:

```text
src/
├── data/
│   ├── normalizeProduct.js
│   └── enrichProduct.js
├── filters/
│   ├── categoryRules.js
│   ├── materialRules.js
│   ├── colorRules.js
│   ├── search.js
│   ├── price.js
│   ├── filterProducts.js
│   └── facetCounts.js
├── state/
│   └── filterState.js
├── ui/
│   ├── FilterSheet.jsx
│   ├── PriceFilter.jsx
│   └── ProductGrid.jsx
└── tests/
    ├── classification.test.js
    ├── filters.test.js
    └── search.test.js
```

หลักการ:

- rules อยู่ที่เดียว
- parser อยู่ที่เดียว
- UI ไม่ควรมี regex classification ฝังอยู่
- filter function ควร test ได้โดยไม่ต้องเปิด browser

## 32. สรุป Algorithm แบบสั้น

```text
raw rows
  -> normalize to product objects
  -> enrich derived fields from model code
  -> store in allData
  -> read filter state
  -> apply series/wishlist when not searching
  -> apply search exact first, fuzzy fallback
  -> apply price
  -> apply subtype
  -> apply material
  -> apply color
  -> sort
  -> save to filtered
  -> render product grid
```

## 33. หลักคิดที่สำคัญที่สุด

หัวใจของระบบนี้ไม่ใช่ปุ่ม filter แต่คือการสร้าง "ภาษากลางของสินค้า" ก่อน

ในโปรเจกต์นี้ ภาษากลางคือ:

```js
{
  model,
  image,
  retailPrice,
  promoPrice,
  sourceIndex,
  series,
  prefix,
  subType,
  material,
  color,
  effectivePrice
}
```

เมื่อทุกสินค้ามีภาษากลางเหมือนกัน:

- filter จะเขียนง่าย
- count จะคำนวณง่าย
- UI จะไม่ต้องรู้รายละเอียดการ parse
- search/sort/share/deep link จะทำงานบน model เดียวกัน
- ย้ายไป project อื่นได้โดยเปลี่ยนแค่ rule และ schema ไม่ต้องเปลี่ยนแนวคิดทั้งระบบ

