/** Material and color maps (Product_filter.md §7–§8). */

export const MATERIAL_MAP = {
  R: 'เรซิน / ยาง',
  D: 'สแตนเลส',
  L: 'หนัง',
  G: 'สายบาน/ชุบทอง',
  SG: 'สองกษัตริย์',
  GL: 'ทอง + หนัง',
  T: 'ไทเทเนียม',
  C: 'คอมโพสิต',
};

/** Known strap material codes — reject random suffixes like HC, RL from model numbers. */
export const VALID_STRAP_MATERIALS = new Set(Object.keys(MATERIAL_MAP));

export const COLOR_MAP = {
  1: { label: 'ดำ', hex: '#1d1d1f' },
  2: { label: 'น้ำเงิน', hex: '#2563eb' },
  3: { label: 'เขียว', hex: '#16a34a' },
  4: { label: 'แดง', hex: '#dc2626' },
  5: { label: 'น้ำตาล', hex: '#92400e' },
  6: { label: 'ม่วง', hex: '#7c3aed' },
  7: { label: 'ขาว/เงิน', hex: '#d1d5db' },
  8: { label: 'เทา', hex: '#6b7280' },
  9: { label: 'ทอง/เหลือง', hex: '#d97706' },
};

export function getMaterialLabel(code) {
  return MATERIAL_MAP[code] || null;
}

export function getColorMeta(code) {
  return COLOR_MAP[code] || { label: code, hex: '#9ca3af' };
}
