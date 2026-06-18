-- Admin-configurable units sold display (avoids full catalog scan)

ALTER TABLE public.shop_settings
  ADD COLUMN IF NOT EXISTS units_sold_display integer;
