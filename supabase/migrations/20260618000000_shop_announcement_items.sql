-- Announcement marquee bar: master switch + per-item messages

ALTER TABLE public.shop_settings
  ADD COLUMN IF NOT EXISTS announcement_enabled boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.shop_announcement_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text text NOT NULL CHECK (char_length(trim(text)) > 0 AND char_length(text) <= 500),
  link_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shop_announcement_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS shop_announcement_items_admin ON public.shop_announcement_items;
CREATE POLICY shop_announcement_items_admin ON public.shop_announcement_items
  FOR ALL TO authenticated
  USING (public.auth_is_shop_admin())
  WITH CHECK (public.auth_is_shop_admin());

DROP TRIGGER IF EXISTS shop_announcement_items_updated_at ON public.shop_announcement_items;
CREATE TRIGGER shop_announcement_items_updated_at
  BEFORE UPDATE ON public.shop_announcement_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
