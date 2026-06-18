import { PROMO_TYPE_LIST } from './promo-types.js';

export const VAULT_STATUS_ALL = 'all';
export const VAULT_TYPE_ALL = 'all';
export const VAULT_SORT_NAME = 'name';
export const VAULT_SORT_NEWEST = 'newest';

const CLOSED_STATUSES = new Set(['inactive', 'expired', 'exhausted']);
const PENDING_STATUSES = new Set(['draft', 'scheduled']);

export function isClosedStatus(status) {
  return CLOSED_STATUSES.has(status);
}

export function isPendingStatus(status) {
  return PENDING_STATUSES.has(status);
}

export function filterPromos(promos, { type = VAULT_TYPE_ALL, status = VAULT_STATUS_ALL, query = '' } = {}) {
  let list = promos ?? [];
  const q = String(query).trim().toLowerCase();

  if (type !== VAULT_TYPE_ALL) {
    list = list.filter((p) => p.promo_type === type);
  }

  if (status !== VAULT_STATUS_ALL) {
    if (status === 'closed') {
      list = list.filter((p) => isClosedStatus(p.status));
    } else if (status === 'pending') {
      list = list.filter((p) => isPendingStatus(p.status));
    } else {
      list = list.filter((p) => p.status === status);
    }
  }

  if (q) {
    list = list.filter(
      (p) =>
        String(p.display_name || '').toLowerCase().includes(q) ||
        String(p.public_code || '').toLowerCase().includes(q) ||
        String(p.internal_code || '').toLowerCase().includes(q),
    );
  }

  return list;
}

export function sortPromos(promos, sort = VAULT_SORT_NEWEST) {
  const list = [...(promos ?? [])];
  if (sort === VAULT_SORT_NAME) {
    list.sort((a, b) =>
      String(a.display_name || '').localeCompare(String(b.display_name || ''), 'th'),
    );
    return list;
  }
  list.sort((a, b) => {
    const aTime = new Date(a.updated_at || a.created_at || 0).getTime();
    const bTime = new Date(b.updated_at || b.created_at || 0).getTime();
    return bTime - aTime;
  });
  return list;
}

export function buildVaultStats(promos) {
  const all = promos ?? [];
  return {
    total: all.length,
    active: all.filter((p) => p.status === 'active').length,
    pending: all.filter((p) => isPendingStatus(p.status)).length,
    closed: all.filter((p) => isClosedStatus(p.status)).length,
  };
}

export function countPromosByStatus(promos, statusKey) {
  if (statusKey === VAULT_STATUS_ALL) return (promos ?? []).length;
  if (statusKey === 'closed') return (promos ?? []).filter((p) => isClosedStatus(p.status)).length;
  if (statusKey === 'pending') return (promos ?? []).filter((p) => isPendingStatus(p.status)).length;
  return (promos ?? []).filter((p) => p.status === statusKey).length;
}

export function countPromosByType(promos, typeKey) {
  if (typeKey === VAULT_TYPE_ALL) return (promos ?? []).length;
  return (promos ?? []).filter((p) => p.promo_type === typeKey).length;
}

export function groupPromosByType(promos) {
  const map = Object.fromEntries(PROMO_TYPE_LIST.map((t) => [t, []]));
  for (const promo of promos ?? []) {
    if (map[promo.promo_type]) map[promo.promo_type].push(promo);
  }
  return map;
}

export function formToPreviewPromo(form) {
  if (!form) return null;
  return {
    display_name: form.display_name || 'ชื่อโปร',
    promo_type: form.promo_type,
    discount_mode: form.discount_mode,
    discount_value: form.discount_value,
    min_order: Number(form.min_order) || 0,
    public_code: form.public_code,
    code_entry_enabled: form.code_entry_enabled,
  };
}
