/** CASIO watch series classification (Product_filter.md §4). */

export const SERIES_RULES = [
  {
    id: 'gshock',
    label: 'G-SHOCK',
    test: (m) => /^(G[A-Z]|GW|GM|GBD|GG|GST|GPR|GR|DW-[56789]|DW-H|GMA|MTG|MRG)/i.test(m),
  },
  {
    id: 'babyg',
    label: 'Baby-G',
    test: (m) => /^(B[A-Z]|BG[A-Z]|BGD|BGA|BGS|BA-|MSG|SHE)/i.test(m),
  },
  {
    id: 'edifice',
    label: 'Edifice',
    test: (m) => /^(EF|EQ[A-Z]|ECB|ERA|EFR|EFS|EFV)/i.test(m),
  },
  {
    id: 'protrek',
    label: 'PRO TREK',
    test: (m) => /^(PR[GWJST]|WSD)/i.test(m),
  },
  { id: 'standard', label: 'Casio ทั่วไป', test: () => true },
];

export function getSeries(modelCode) {
  const m = String(modelCode || '').trim();
  for (const r of SERIES_RULES) {
    if (r.id !== 'standard' && r.test(m)) return r.id;
  }
  return 'standard';
}

export function getSeriesLabel(seriesId) {
  return SERIES_RULES.find((r) => r.id === seriesId)?.label || seriesId;
}
