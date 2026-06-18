import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { isPromoActive, type PromoRow } from './promo.ts';

/** Count non-reversed redemptions for a user + promo. */
async function countUserPromoRedemptions(
  db: SupabaseClient,
  promoId: string,
  userId: string,
): Promise<number> {
  const { count, error } = await db
    .from('promo_redemptions')
    .select('id', { count: 'exact', head: true })
    .eq('promo_code_id', promoId)
    .eq('user_id', userId)
    .is('reversed_at', null);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

/** Drop promos where the user has hit max_uses_per_user (guests skip this check). */
export async function filterPromosByPerUserLimit(
  db: SupabaseClient,
  promos: PromoRow[],
  userId: string | null,
): Promise<PromoRow[]> {
  if (!userId) return promos;

  const result: PromoRow[] = [];
  for (const promo of promos) {
    const maxPerUser = (promo as PromoRow & { max_uses_per_user?: number | null }).max_uses_per_user;
    if (maxPerUser == null) {
      result.push(promo);
      continue;
    }
    const used = await countUserPromoRedemptions(db, promo.id, userId);
    if (used < maxPerUser) result.push(promo);
  }
  return result;
}

/** True if user may redeem this promo (per-user limit). Guests always pass. */
export async function isPromoWithinPerUserLimit(
  db: SupabaseClient,
  promo: PromoRow,
  userId: string | null,
): Promise<boolean> {
  if (!userId) return true;
  const maxPerUser = (promo as PromoRow & { max_uses_per_user?: number | null }).max_uses_per_user;
  if (maxPerUser == null) return true;
  const used = await countUserPromoRedemptions(db, promo.id, userId);
  return used < maxPerUser;
}

/** Load promos eligible for a user (broadcast + targeted grants). */
export async function loadEligiblePromos(
  db: SupabaseClient,
  userId: string | null,
): Promise<PromoRow[]> {
  const { data: codes, error } = await db.from('promo_codes').select('*');
  if (error) throw new Error(error.message);

  const active = (codes as PromoRow[]).filter((p) => isPromoActive(p));
  const result: PromoRow[] = [];

  for (const promo of active) {
    if (promo.distribution === 'broadcast') {
      result.push(promo);
      continue;
    }
    if (promo.distribution === 'targeted' && userId) {
      const { data: grants } = await db
        .from('promo_grants')
        .select('id')
        .eq('promo_code_id', promo.id)
        .eq('user_id', userId)
        .is('revoked_at', null)
        .limit(1);
      if (grants?.length) result.push(promo);
    }
  }

  return filterPromosByPerUserLimit(db, result, userId);
}

/** Resolve promos by explicit IDs (must be active + user eligible). */
export async function resolvePromosByIds(
  db: SupabaseClient,
  promoIds: string[],
  userId: string | null,
): Promise<PromoRow[]> {
  if (!promoIds.length) return [];
  const eligible = await loadEligiblePromos(db, userId);
  const idSet = new Set(promoIds);
  return eligible.filter((p) => idSet.has(p.id));
}

/** Look up promo by public_code or internal_code (case-insensitive). */
export async function findPromoByCode(
  db: SupabaseClient,
  code: string,
): Promise<PromoRow | null> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;

  const { data: byPublic } = await db
    .from('promo_codes')
    .select('*')
    .ilike('public_code', normalized)
    .maybeSingle();
  if (byPublic) return byPublic as PromoRow;

  const { data: byInternal } = await db
    .from('promo_codes')
    .select('*')
    .ilike('internal_code', normalized)
    .maybeSingle();
  return (byInternal as PromoRow) || null;
}
