import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { calcPromoTotals } from './promo-pricing.ts';
import { findPromoByCode, loadEligiblePromos, resolvePromosByIds } from './promo-resolve.ts';
import { isPromoActive } from './promo.ts';

export type QuoteInput = {
  subtotal: number;
  shippingFee: number;
  paymentMethod?: string;
  appliedPromoIds?: string[];
  couponCode?: string | null;
  userId?: string | null;
};

export type QuoteResult = {
  discount: number;
  shipping_fee: number;
  grand_total: number;
  breakdown: Array<{ id: string; display_name: string; promo_type: string; amount: number }>;
  applied_promo_ids: string[];
  coupon_code: string | null;
};

export async function quoteOrder(db: SupabaseClient, input: QuoteInput): Promise<QuoteResult> {
  const {
    subtotal,
    shippingFee,
    paymentMethod = '',
    appliedPromoIds = [],
    couponCode = null,
    userId = null,
  } = input;

  let promos: PromoRow[] = await loadEligiblePromos(db, userId);

  if (couponCode) {
    const byCode = await findPromoByCode(db, couponCode);
    if (byCode && isPromoActive(byCode)) {
      const exists = promos.some((p) => p.id === byCode.id);
      if (!exists) promos = [...promos, byCode];
    }
  }

  if (appliedPromoIds.length) {
    promos = await resolvePromosByIds(db, appliedPromoIds, userId);
    if (couponCode) {
      const byCode = await findPromoByCode(db, couponCode);
      if (byCode && isPromoActive(byCode) && !promos.some((p) => p.id === byCode.id)) {
        promos = [...promos, byCode];
      }
    }
  }

  const totals = calcPromoTotals(subtotal, shippingFee, promos, { paymentMethod });

  let resolvedCouponCode: string | null = null;
  if (couponCode) {
    const byCode = await findPromoByCode(db, couponCode);
    if (byCode && totals.appliedPromoIds.includes(byCode.id)) {
      resolvedCouponCode = byCode.public_code || byCode.internal_code;
    }
  }

  return {
    discount: totals.discount,
    shipping_fee: totals.shippingFee,
    grand_total: totals.grandTotal,
    breakdown: totals.breakdown,
    applied_promo_ids: totals.appliedPromoIds,
    coupon_code: resolvedCouponCode,
  };
}

export async function recordPromoRedemptions(
  db: SupabaseClient,
  orderId: number,
  userId: string | null,
  appliedPromoIds: string[],
  breakdown: QuoteResult['breakdown'],
): Promise<void> {
  if (!appliedPromoIds.length) return;

  const amounts: Record<string, number> = {};
  for (const line of breakdown) {
    amounts[line.id] = line.amount;
  }

  const { error } = await db.rpc('increment_promo_usage', {
    p_promo_ids: appliedPromoIds,
    p_order_id: orderId,
    p_user_id: userId,
    p_amounts: amounts,
  });
  if (error) console.error('increment_promo_usage failed:', error.message);
}
