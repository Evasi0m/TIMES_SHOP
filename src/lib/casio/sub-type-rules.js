import { getPrefix } from './parse-model.js';

/** Sub-types per series (Product_filter.md §6). */
export const SERIES_SUBS = {
  gshock: [
    { id: 'gs-anadigi', label: 'เข็ม+ดิจิทัล', prefixes: ['GA', 'GMA', 'GBA'] },
    { id: 'gs-digital', label: 'ดิจิทัล', prefixes: ['DW', 'GBD', 'GW', 'GWM'] },
    { id: 'gs-metal', label: 'สาย Metal / G-Steel', prefixes: ['GST', 'GM', 'GMS', 'GMW'] },
  ],
  standard: [
    { id: 'st-men', label: 'ผู้ชาย', prefixes: ['MTP', 'MTD', 'MTS', 'MDV', 'MW', 'AMW', 'MRW', 'MCW', 'HDA', 'HDC', 'AEQ'] },
    { id: 'st-lady', label: 'ผู้หญิง', prefixes: ['LTP', 'LTF', 'LRW', 'LWA'] },
    { id: 'st-digi', label: 'ดิจิทัล / Unisex', prefixes: ['A', 'F', 'MQ', 'W', 'B', 'AE', 'DB', 'LA', 'CA'] },
  ],
  edifice: [
    { id: 'ed-chrono', label: 'นาฬิกาจับเวลา', prefixes: ['EF', 'EFR', 'EFV', 'EFS', 'EFB'] },
    { id: 'ed-connect', label: 'Smart / Solar', prefixes: ['ECB', 'EQB', 'ERA'] },
  ],
  babyg: [
    { id: 'bg-anadigi', label: 'เข็ม+ดิจิทัล', prefixes: ['BGA', 'BA', 'MSG', 'SHE'] },
    { id: 'bg-digital', label: 'ดิจิทัล', prefixes: ['BGD', 'BGS'] },
  ],
};

export function matchSubType(modelCode, sub) {
  if (!sub) return true;
  const prefix = getPrefix(modelCode);
  const m = String(modelCode || '').trim().toUpperCase();
  return sub.prefixes.some((p) => prefix === p || m.indexOf(`${p}-`) === 0);
}

export function getSubTypeForModel(modelCode, seriesId) {
  const subs = SERIES_SUBS[seriesId];
  if (!subs) return null;
  for (const sub of subs) {
    if (matchSubType(modelCode, sub)) return sub.id;
  }
  return null;
}

export function getSubTypeLabel(seriesId, subTypeId) {
  const sub = SERIES_SUBS[seriesId]?.find((s) => s.id === subTypeId);
  return sub?.label || subTypeId;
}
