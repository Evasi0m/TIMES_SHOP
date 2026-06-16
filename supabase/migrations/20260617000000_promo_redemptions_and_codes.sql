-- Phase 0/1: promo redemptions, public codes, atomic usage increment

ALTER TABLE public.promo_codes
  ADD COLUMN IF NOT EXISTS public_code text,
  ADD COLUMN IF NOT EXISTS code_entry_enabled boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS promo_codes_public_code_unique_idx
  ON public.promo_codes (upper(public_code))
  WHERE public_code IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.promo_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id uuid NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  order_id bigint NOT NULL,
  amount numeric(12, 2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS promo_redemptions_order_idx ON public.promo_redemptions (order_id);
CREATE INDEX IF NOT EXISTS promo_redemptions_promo_idx ON public.promo_redemptions (promo_code_id);

ALTER TABLE public.promo_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY promo_redemptions_admin_all ON public.promo_redemptions
  FOR ALL USING (public.auth_is_shop_admin()) WITH CHECK (public.auth_is_shop_admin());

CREATE POLICY promo_redemptions_user_select ON public.promo_redemptions
  FOR SELECT USING (user_id = auth.uid());

-- Atomic increment used_count with max_uses guard
CREATE OR REPLACE FUNCTION public.increment_promo_usage(
  p_promo_ids uuid[],
  p_order_id bigint,
  p_user_id uuid,
  p_amounts jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pid uuid;
  amt numeric(12, 2);
BEGIN
  IF p_promo_ids IS NULL OR array_length(p_promo_ids, 1) IS NULL THEN
    RETURN;
  END IF;

  FOREACH pid IN ARRAY p_promo_ids LOOP
    amt := coalesce((p_amounts ->> pid::text)::numeric, 0);

    UPDATE public.promo_codes
    SET used_count = used_count + 1,
        updated_at = now()
    WHERE id = pid
      AND is_active = true
      AND (max_uses IS NULL OR used_count < max_uses);

    INSERT INTO public.promo_redemptions (promo_code_id, user_id, order_id, amount)
    VALUES (pid, p_user_id, p_order_id, amt);
  END LOOP;
END;
$$;

-- Wishlist table (Phase 3)
CREATE TABLE IF NOT EXISTS public.customer_wishlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tiktok_sku_id text NOT NULL,
  tiktok_product_id text,
  product_name text,
  sku_name text,
  image_url text,
  unit_price numeric(12, 2),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, tiktok_sku_id)
);

CREATE INDEX IF NOT EXISTS customer_wishlist_user_idx ON public.customer_wishlist (user_id);

ALTER TABLE public.customer_wishlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY wishlist_user_all ON public.customer_wishlist
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY wishlist_admin_select ON public.customer_wishlist
  FOR SELECT USING (public.auth_is_shop_admin());
