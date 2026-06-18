/** POS cumulative units sold badge (from shop-get-catalog / shop-get-product). */

export function shouldShowUnitsSold(n) {
  return Number(n) >= 1;
}

export function formatUnitsSold(n) {
  const qty = Number(n) || 0;
  return `ขายแล้ว ${qty.toLocaleString('th-TH')} ชิ้น`;
}

/** TikTok-style compact count: 13700 → "13.7K" */
export function formatCompactUnitsSold(n) {
  const qty = Number(n) || 0;
  if (qty < 1000) return qty.toLocaleString('th-TH');
  if (qty < 1_000_000) {
    const thousands = qty / 1000;
    if (thousands >= 100) return `${Math.round(thousands)}K`;
    const rounded = Math.round(thousands * 10) / 10;
    return Number.isInteger(rounded) ? `${rounded}K` : `${rounded.toFixed(1)}K`;
  }
  const millions = qty / 1_000_000;
  const rounded = Math.round(millions * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}M` : `${rounded.toFixed(1)}M`;
}

/** Store profile sold line — null when no valid count */
export function formatStoreSoldLabel(n) {
  const qty = Number(n);
  if (!Number.isFinite(qty) || qty < 1) return null;
  return `ขายแล้ว ${formatCompactUnitsSold(qty)}`;
}
