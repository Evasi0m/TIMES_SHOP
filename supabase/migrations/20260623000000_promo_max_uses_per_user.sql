-- Per-user promo usage limit + reversal tracking for cancel flow

ALTER TABLE public.promo_codes
  ADD COLUMN IF NOT EXISTS max_uses_per_user integer;

ALTER TABLE public.promo_redemptions
  ADD COLUMN IF NOT EXISTS reversed_at timestamptz;

CREATE INDEX IF NOT EXISTS promo_redemptions_user_promo_idx
  ON public.promo_redemptions (promo_code_id, user_id)
  WHERE reversed_at IS NULL;
