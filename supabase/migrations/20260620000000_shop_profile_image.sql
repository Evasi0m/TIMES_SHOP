-- Store profile image URL for homepage store hero (admin-configured, URL only)

ALTER TABLE public.shop_settings
  ADD COLUMN IF NOT EXISTS profile_image_url text;
