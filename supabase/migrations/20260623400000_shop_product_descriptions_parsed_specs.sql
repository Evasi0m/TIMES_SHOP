-- Add structured spec cache parsed from description text (PDP spec summary).

ALTER TABLE public.shop_product_descriptions
  ADD COLUMN IF NOT EXISTS parsed_specs jsonb;

COMMENT ON COLUMN public.shop_product_descriptions.parsed_specs IS
  'Structured spec rows [{ key, label, value }] parsed from description — backfill via shop-admin-sync-descriptions.';

CREATE INDEX IF NOT EXISTS shop_product_descriptions_parsed_specs_null_idx
  ON public.shop_product_descriptions (tiktok_product_id)
  WHERE parsed_specs IS NULL;
