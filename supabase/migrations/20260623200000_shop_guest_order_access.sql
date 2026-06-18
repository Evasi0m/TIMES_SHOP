-- Guest order lookup tokens (Shop-side metadata only)

CREATE TABLE IF NOT EXISTS public.shop_guest_order_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id bigint NOT NULL,
  web_order_number text NOT NULL,
  phone_hash text NOT NULL,
  lookup_token text UNIQUE NOT NULL,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS shop_guest_order_access_order_idx
  ON public.shop_guest_order_access (order_id);

CREATE INDEX IF NOT EXISTS shop_guest_order_access_phone_hash_idx
  ON public.shop_guest_order_access (web_order_number, phone_hash);

ALTER TABLE public.shop_guest_order_access ENABLE ROW LEVEL SECURITY;

-- No client policies — access via Edge Functions with service role only
