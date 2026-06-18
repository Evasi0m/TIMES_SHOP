-- Homepage design module: configurable blocks + PDP view tracking

CREATE TABLE IF NOT EXISTS public.shop_homepage_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('banner', 'product_row', 'coupon_row')),
  title text,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.shop_product_views (
  tiktok_product_id text PRIMARY KEY,
  view_count bigint NOT NULL DEFAULT 0,
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_viewed_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shop_homepage_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_product_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS shop_homepage_blocks_admin ON public.shop_homepage_blocks;
CREATE POLICY shop_homepage_blocks_admin ON public.shop_homepage_blocks
  FOR ALL TO authenticated
  USING (public.auth_is_shop_admin())
  WITH CHECK (public.auth_is_shop_admin());

DROP POLICY IF EXISTS shop_product_views_admin ON public.shop_product_views;
CREATE POLICY shop_product_views_admin ON public.shop_product_views
  FOR ALL TO authenticated
  USING (public.auth_is_shop_admin())
  WITH CHECK (public.auth_is_shop_admin());

DROP TRIGGER IF EXISTS shop_homepage_blocks_updated_at ON public.shop_homepage_blocks;
CREATE TRIGGER shop_homepage_blocks_updated_at
  BEFORE UPDATE ON public.shop_homepage_blocks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS shop_product_views_updated_at ON public.shop_product_views;
CREATE TRIGGER shop_product_views_updated_at
  BEFORE UPDATE ON public.shop_product_views
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.increment_product_view(p_id text, p_snapshot jsonb)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.shop_product_views (tiktok_product_id, view_count, snapshot, last_viewed_at)
  VALUES (p_id, 1, coalesce(p_snapshot, '{}'::jsonb), now())
  ON CONFLICT (tiktok_product_id) DO UPDATE
    SET view_count = shop_product_views.view_count + 1,
        snapshot = EXCLUDED.snapshot,
        last_viewed_at = now(),
        updated_at = now();
$$;
