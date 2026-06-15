import { calcPromoTotals, filterActivePromos } from '../lib/promo-pricing.js';
import { DISTRIBUTION_MODES, PROMO_TYPES } from '../lib/promo-types.js';

const PROMO_CODES_KEY = 'times_shop_promo_codes';
const PROMO_GRANTS_KEY = 'times_shop_promo_grants';

export const MOCK_CUSTOMER_DIRECTORY = [
  { id: 'mock-user', email: 'demo@times.store', display_name: 'ลูกค้าทดสอบ' },
  { id: 'user-vip', email: 'vip@times.store', display_name: 'ลูกค้า VIP' },
  { id: 'user-new', email: 'new@times.store', display_name: 'ลูกค้าใหม่' },
];

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function readPromoCodes() {
  return readJson(PROMO_CODES_KEY, []);
}

export function writePromoCodes(codes) {
  writeJson(PROMO_CODES_KEY, codes);
}

export function readPromoGrants() {
  return readJson(PROMO_GRANTS_KEY, []);
}

export function writePromoGrants(grants) {
  writeJson(PROMO_GRANTS_KEY, grants);
}

function toClientPromo(promo, source) {
  return {
    id: promo.id,
    display_name: promo.display_name,
    promo_type: promo.promo_type,
    discount_mode: promo.discount_mode,
    discount_value: promo.discount_value,
    min_order: promo.min_order ?? 0,
    source,
    starts_at: promo.starts_at,
    expires_at: promo.expires_at,
    is_active: promo.is_active,
    distribution: promo.distribution,
  };
}

export function getActivePromosForUser(userId) {
  const codes = readPromoCodes();
  const grants = readPromoGrants();
  const active = filterActivePromos(codes);
  const result = [];

  for (const promo of active) {
    if (promo.distribution === DISTRIBUTION_MODES.BROADCAST) {
      result.push(toClientPromo(promo, 'broadcast'));
      continue;
    }
    if (promo.distribution === DISTRIBUTION_MODES.TARGETED && userId) {
      const granted = grants.some(
        (g) => g.promo_code_id === promo.id && g.user_id === userId && !g.revoked_at
      );
      if (granted) result.push(toClientPromo(promo, 'targeted'));
    }
  }

  return result;
}

export function getWalletPromosForUser(userId) {
  if (!userId) return [];
  const codes = readPromoCodes();
  const grants = readPromoGrants().filter((g) => g.user_id === userId && !g.revoked_at);
  return grants
    .map((g) => {
      const promo = codes.find((c) => c.id === g.promo_code_id);
      if (!promo) return null;
      return {
        ...toClientPromo(promo, 'targeted'),
        granted_at: g.granted_at,
        status: filterActivePromos([promo]).length ? 'active' : 'expired',
      };
    })
    .filter(Boolean);
}

export function computeOrderPromoTotals(subtotal, baseShippingFee, paymentMethod, userId) {
  const promos = getActivePromosForUser(userId);
  return calcPromoTotals(subtotal, baseShippingFee, promos, { paymentMethod });
}

function generateInternalCode() {
  return `PROMO-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

export function adminListPromos() {
  const codes = readPromoCodes();
  const grants = readPromoGrants();
  const enriched = codes.map((p) => ({
    ...p,
    grant_count: grants.filter((g) => g.promo_code_id === p.id && !g.revoked_at).length,
    status: getPromoStatus(p),
  }));
  return { ok: true, promos: enriched };
}

function getPromoStatus(promo) {
  if (!promo.is_active) return 'inactive';
  if (promo.distribution === DISTRIBUTION_MODES.DRAFT) return 'draft';
  const now = Date.now();
  if (promo.starts_at && new Date(promo.starts_at).getTime() > now) return 'scheduled';
  if (promo.expires_at && new Date(promo.expires_at).getTime() < now) return 'expired';
  if (promo.max_uses != null && Number(promo.used_count) >= Number(promo.max_uses)) return 'exhausted';
  return 'active';
}

export function adminUpsertPromo(payload) {
  const codes = readPromoCodes();
  const now = new Date().toISOString();
  const type = payload.promo_type;
  if (!Object.values(PROMO_TYPES).includes(type)) {
    return { ok: false, error: 'validation_failed', message: 'ประเภทโปรไม่ถูกต้อง' };
  }
  if (!payload.display_name?.trim()) {
    return { ok: false, error: 'validation_failed', message: 'กรุณากรอกชื่อที่ลูกค้าเห็น' };
  }

  const base = {
    display_name: payload.display_name.trim(),
    promo_type: payload.promo_type,
    discount_mode: type === PROMO_TYPES.FREE_SHIPPING ? null : payload.discount_mode,
    discount_value: type === PROMO_TYPES.FREE_SHIPPING ? 0 : Number(payload.discount_value) || 0,
    min_order: Number(payload.min_order) || 0,
    starts_at: payload.starts_at || null,
    expires_at: payload.no_expiry ? null : payload.expires_at || null,
    max_uses: payload.max_uses != null && payload.max_uses !== '' ? Number(payload.max_uses) : null,
    is_active: payload.is_active !== false,
    distribution: payload.distribution || DISTRIBUTION_MODES.DRAFT,
    updated_at: now,
  };

  if (payload.id) {
    const idx = codes.findIndex((c) => c.id === payload.id);
    if (idx < 0) return { ok: false, error: 'not_found', message: 'ไม่พบโปร' };
    codes[idx] = { ...codes[idx], ...base };
    writePromoCodes(codes);
    return { ok: true, promo: codes[idx] };
  }

  const promo = {
    id: crypto.randomUUID(),
    internal_code: payload.internal_code?.trim() || generateInternalCode(),
    used_count: 0,
    created_at: now,
    ...base,
  };
  codes.push(promo);
  writePromoCodes(codes);
  return { ok: true, promo };
}

export function adminDistributePromo({ promo_id, mode, user_ids = [], emails = [] }) {
  const codes = readPromoCodes();
  const promo = codes.find((c) => c.id === promo_id);
  if (!promo) return { ok: false, error: 'not_found', message: 'ไม่พบโปร' };

  if (mode === 'broadcast') {
    promo.distribution = DISTRIBUTION_MODES.BROADCAST;
    promo.is_active = true;
    promo.updated_at = new Date().toISOString();
    writePromoCodes(codes.map((c) => (c.id === promo_id ? promo : c)));
    return { ok: true, promo, message: 'แจกโปรทั้งร้านแล้ว — ลูกค้าและ guest เห็นราคาหลังลดทันที' };
  }

  if (mode === 'targeted') {
    promo.distribution = DISTRIBUTION_MODES.TARGETED;
    promo.is_active = true;
    promo.updated_at = new Date().toISOString();
    writePromoCodes(codes.map((c) => (c.id === promo_id ? promo : c)));

    const grants = readPromoGrants();
    const now = new Date().toISOString();
    const ids = new Set(user_ids);

    for (const email of emails) {
      const match = MOCK_CUSTOMER_DIRECTORY.find(
        (u) => u.email.toLowerCase() === String(email).trim().toLowerCase()
      );
      if (match) ids.add(match.id);
    }

    for (const userId of ids) {
      const exists = grants.some(
        (g) => g.promo_code_id === promo_id && g.user_id === userId && !g.revoked_at
      );
      if (!exists) {
        grants.push({
          id: crypto.randomUUID(),
          promo_code_id: promo_id,
          user_id: userId,
          granted_at: now,
          revoked_at: null,
        });
      }
    }
    writePromoGrants(grants);
    return {
      ok: true,
      promo,
      granted_count: ids.size,
      message: `แจกโปรให้ลูกค้า ${ids.size} คนแล้ว`,
    };
  }

  return { ok: false, error: 'validation_failed', message: 'โหมดแจกไม่ถูกต้อง' };
}

export function adminRevokePromo({ promo_id, user_id }) {
  const codes = readPromoCodes();
  const promo = codes.find((c) => c.id === promo_id);
  if (!promo) return { ok: false, error: 'not_found', message: 'ไม่พบโปร' };

  if (user_id) {
    const grants = readPromoGrants();
    writePromoGrants(
      grants.map((g) =>
        g.promo_code_id === promo_id && g.user_id === user_id && !g.revoked_at
          ? { ...g, revoked_at: new Date().toISOString() }
          : g
      )
    );
    return { ok: true, message: 'ถอนสิทธิ์ลูกค้าแล้ว' };
  }

  promo.is_active = false;
  promo.updated_at = new Date().toISOString();
  writePromoCodes(codes.map((c) => (c.id === promo_id ? promo : c)));
  return { ok: true, message: 'ปิดใช้งานโปรแล้ว' };
}

export function adminListCustomers() {
  return { ok: true, customers: MOCK_CUSTOMER_DIRECTORY };
}

export function incrementPromoUsage(appliedPromoIds) {
  if (!appliedPromoIds?.length) return;
  const codes = readPromoCodes();
  writePromoCodes(
    codes.map((c) =>
      appliedPromoIds.includes(c.id)
        ? { ...c, used_count: (Number(c.used_count) || 0) + 1 }
        : c
    )
  );
}
