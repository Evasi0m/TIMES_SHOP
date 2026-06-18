-- Store cover image URL for homepage glass profile hero (admin-configured, URL only)

ALTER TABLE public.shop_settings
  ADD COLUMN IF NOT EXISTS cover_image_url text;
