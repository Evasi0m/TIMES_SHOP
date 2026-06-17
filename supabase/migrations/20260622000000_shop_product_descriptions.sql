-- TikTok product descriptions cached on Shop project (PDP only; insert-once, no refresh).

CREATE TABLE IF NOT EXISTS public.shop_product_descriptions (
  tiktok_product_id text PRIMARY KEY,
  description       text NOT NULL,
  fetched_at        timestamptz NOT NULL DEFAULT now(),
  created_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shop_product_descriptions ENABLE ROW LEVEL SECURITY;

-- No policies for anon/authenticated — read/write via Edge Functions + service role only.

CREATE INDEX IF NOT EXISTS shop_product_descriptions_fetched_at_idx
  ON public.shop_product_descriptions (fetched_at DESC);
