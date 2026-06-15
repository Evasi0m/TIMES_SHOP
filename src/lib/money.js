// Money helpers — follows the TIMES_POS money.js pattern (fmtTHB, roundMoney).

export function roundMoney(value) {
  const n = Number(value) || 0;
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

const thb = new Intl.NumberFormat('th-TH', {
  style: 'currency',
  currency: 'THB',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function fmtTHB(value) {
  return thb.format(roundMoney(value));
}

/** Split price for TikTok-style smaller ฿ symbol. */
export function formatPriceParts(value) {
  const n = roundMoney(value);
  const formatted = n.toLocaleString('th-TH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return { symbol: '฿', amount: formatted, value: n };
}

export function formatPriceRangeParts(min, max) {
  const lo = roundMoney(min);
  const hi = roundMoney(max);
  if (lo > 0 && hi > lo) {
    return {
      symbol: '฿',
      amount: `${lo.toLocaleString('th-TH')}-${hi.toLocaleString('th-TH')}`,
      value: lo,
      isRange: true,
    };
  }
  return { ...formatPriceParts(lo || hi), isRange: false };
}

// Thai date like "15 มิ.ย. 2569"
const dateFmt = new Intl.DateTimeFormat('th-TH', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

export function fmtThaiDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return dateFmt.format(d);
}
