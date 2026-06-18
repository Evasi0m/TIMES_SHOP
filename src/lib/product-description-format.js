/** CASIO / TikTok TH spec labels — longest first for matching. */
export const SPEC_FIELD_LABELS = [
  'แหล่งจ่ายพลังงานและอายุการใช้งานแบตเตอรี่',
  'อายุการใช้งานแบตเตอรี่ประมาณ',
  'อายุการใช้งานแบตเตอรี่',
  'ขนาดตัวเรือน (ก x ย x ส)',
  'วัสดุตัวเรือนและกรอบ',
  'ฟังก์ชันการฝึกซ้อม',
  'คุณสมบัติเซนเซอร์',
  'ขนาดตัวเรือน',
  'โครงสร้าง',
  'น้ำหนัก',
  'กันน้ำ',
  'สาย',
  'กระจก',
  'หน้าปัด',
  'แบตเตอรี่',
].sort((a, b) => b.length - a.length);

const LABEL_TO_KEY = {
  'ขนาดตัวเรือน (ก x ย x ส)': 'case_size',
  'ขนาดตัวเรือน': 'case_size',
  'น้ำหนัก': 'weight',
  'วัสดุตัวเรือนและกรอบ': 'case_material',
  'สาย': 'strap',
  'โครงสร้าง': 'structure',
  'กันน้ำ': 'water_resist',
  'แหล่งจ่ายพลังงานและอายุการใช้งานแบตเตอรี่': 'power',
  'อายุการใช้งานแบตเตอรี่ประมาณ': 'battery_life',
  'อายุการใช้งานแบตเตอรี่': 'battery_life',
  'แบตเตอรี่': 'battery_life',
  'คุณสมบัติเซนเซอร์': 'sensors',
  'ฟังก์ชันการฝึกซ้อม': 'training',
  'กระจก': 'crystal',
  'หน้าปัด': 'dial',
};

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Insert line breaks between CASIO-style spec fields (plain text only). */
export function formatSpecLineBreaks(text) {
  let out = String(text ?? '');
  if (!out.trim()) return out;

  out = out.replace(/\)([ \t]*)([\d~≥≤])/g, (_match, _space, ch) => `)\n${ch}`);
  out = out.replace(/\)([ \t]+)([^\n\s])/g, (_match, _space, ch) => `)\n${ch}`);

  const isSpecSheet = /ขนาดตัวเรือน|วัสดุตัวเรือนและกรอบ|คุณสมบัติเซนเซอร์/.test(out);
  if (!isSpecSheet) {
    return out
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  for (const label of SPEC_FIELD_LABELS) {
    const escaped = escapeRegExp(label);
    out = out.replace(new RegExp(`([^•\\n])(${escaped})`, 'g'), '$1\n\n$2');
    out = out.replace(new RegExp(`(${escaped})([\\d~≥≤])`, 'g'), '$1\n$2');
  }

  return out
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+\n/g, '\n')
    .trim();
}

function labelToKey(label) {
  return LABEL_TO_KEY[label] || label.replace(/\s+/g, '_').slice(0, 40);
}

function findSpecMarkers(text) {
  const markers = [];
  for (const label of SPEC_FIELD_LABELS) {
    let from = 0;
    while (from < text.length) {
      const index = text.indexOf(label, from);
      if (index === -1) break;
      markers.push({ label, key: labelToKey(label), index, length: label.length });
      from = index + label.length;
    }
  }
  markers.sort((a, b) => a.index - b.index || b.length - a.length);

  const deduped = [];
  for (const marker of markers) {
    const prev = deduped[deduped.length - 1];
    if (prev && marker.index < prev.index + prev.length) continue;
    deduped.push(marker);
  }
  return deduped;
}

/** Parse formatted description into label/value spec rows. */
export function parseDescriptionSpecs(text) {
  const source = String(text ?? '').trim();
  if (!source) return [];

  const formatted = formatSpecLineBreaks(source);
  const markers = findSpecMarkers(formatted);
  if (!markers.length) return [];

  const specs = [];
  for (let i = 0; i < markers.length; i += 1) {
    const { label, key, index, length } = markers[i];
    const valueStart = index + length;
    const valueEnd = i + 1 < markers.length ? markers[i + 1].index : formatted.length;
    let value = formatted.slice(valueStart, valueEnd).trim();
    value = value.replace(/^\n+/, '').replace(/\n+$/, '').replace(/\s*\n+\s*/g, ' ');
    if (!value) continue;
    specs.push({ key, label, value });
  }
  return specs;
}

export function getSpecSummaryKeys() {
  return ['case_size', 'weight', 'water_resist', 'battery_life'];
}

/** Pick up to 4 highlight specs for summary grid. */
export function pickSummarySpecs(specs, limit = 4) {
  const order = getSpecSummaryKeys();
  const picked = [];
  const seen = new Set();
  for (const key of order) {
    const row = specs.find((s) => s.key === key);
    if (row && !seen.has(row.key)) {
      picked.push(row);
      seen.add(row.key);
    }
    if (picked.length >= limit) return picked;
  }
  for (const row of specs) {
    if (seen.has(row.key)) continue;
    picked.push(row);
    seen.add(row.key);
    if (picked.length >= limit) break;
  }
  return picked;
}
