/** POS cumulative units sold badge (from shop-get-catalog / shop-get-product). */

export function shouldShowUnitsSold(n) {
  return Number(n) >= 1;
}

export function formatUnitsSold(n) {
  const qty = Number(n) || 0;
  return `ขายแล้ว ${qty.toLocaleString('th-TH')} ชิ้น`;
}
