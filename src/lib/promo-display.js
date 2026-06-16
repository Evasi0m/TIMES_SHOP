import { fmtTHB } from './money.js';
import { DISCOUNT_MODES, PROMO_TYPES } from './promo-types.js';

export function formatPromoDiscount(promo) {
  if (!promo) return '—';
  if (promo.promo_type === PROMO_TYPES.FREE_SHIPPING) return 'ส่งฟรี';
  if (promo.discount_mode === DISCOUNT_MODES.PERCENT) {
    return `ลด ${promo.discount_value}%`;
  }
  return `ลด ${fmtTHB(promo.discount_value)}`;
}

export function formatPromoPeriod(promo) {
  if (!promo.starts_at && !promo.expires_at) return 'ไม่มีวันหมดอายุ';
  const start = promo.starts_at
    ? new Date(promo.starts_at).toLocaleDateString('th-TH')
    : 'ทันที';
  const end = promo.expires_at
    ? new Date(promo.expires_at).toLocaleDateString('th-TH')
    : 'ไม่หมดอายุ';
  return `${start} – ${end}`;
}

const STATUS_LABELS = {
  draft: 'แบบร่าง',
  active: 'ใช้งาน',
  scheduled: 'รอเริ่ม',
  expired: 'หมดอายุ',
  inactive: 'ปิดแล้ว',
  exhausted: 'ครบจำนวน',
};

export function getStatusLabel(status) {
  return STATUS_LABELS[status] || status;
}

export function statusBadgeClass(status) {
  if (status === 'active') return 'badge-pill badge-pill--success';
  if (status === 'scheduled') return 'badge-pill badge-pill--warning';
  if (status === 'inactive' || status === 'expired' || status === 'exhausted') {
    return 'badge-pill badge-pill--muted';
  }
  if (status === 'draft') return 'badge-pill badge-pill--muted';
  return 'badge-pill';
}
