type PromoRow = {
  id: string;
  internal_code: string;
  display_name: string;
  promo_type: string;
  discount_mode: string | null;
  discount_value: number;
  min_order: number;
  starts_at: string | null;
  expires_at: string | null;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
  distribution: string;
  created_at?: string;
  updated_at?: string;
};

export function toClientPromo(promo: PromoRow, source: string) {
  return {
    id: promo.id,
    display_name: promo.display_name,
    promo_type: promo.promo_type,
    discount_mode: promo.discount_mode,
    discount_value: Number(promo.discount_value),
    min_order: Number(promo.min_order ?? 0),
    source,
    starts_at: promo.starts_at,
    expires_at: promo.expires_at,
    is_active: promo.is_active,
    distribution: promo.distribution,
    public_code: (promo as PromoRow & { public_code?: string | null }).public_code ?? null,
    code_entry_enabled: (promo as PromoRow & { code_entry_enabled?: boolean }).code_entry_enabled ?? false,
  };
}

export function isPromoActive(promo: PromoRow, now = Date.now()): boolean {
  if (!promo.is_active) return false;
  if (promo.distribution === 'draft') return false;
  if (promo.starts_at && new Date(promo.starts_at).getTime() > now) return false;
  if (promo.expires_at && new Date(promo.expires_at).getTime() < now) return false;
  if (promo.max_uses != null && Number(promo.used_count) >= Number(promo.max_uses)) return false;
  return true;
}

export function getPromoStatus(promo: PromoRow): string {
  if (!promo.is_active) return 'inactive';
  if (promo.distribution === 'draft') return 'draft';
  const now = Date.now();
  if (promo.starts_at && new Date(promo.starts_at).getTime() > now) return 'scheduled';
  if (promo.expires_at && new Date(promo.expires_at).getTime() < now) return 'expired';
  if (promo.max_uses != null && Number(promo.used_count) >= Number(promo.max_uses)) return 'exhausted';
  return 'active';
}

export function generateInternalCode(): string {
  return `PROMO-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

export type { PromoRow };
