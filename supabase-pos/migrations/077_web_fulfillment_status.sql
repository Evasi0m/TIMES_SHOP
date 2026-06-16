-- POS: web order fulfillment tracking (Phase 4)

ALTER TABLE public.sale_orders
  ADD COLUMN IF NOT EXISTS web_fulfillment_status text,
  ADD COLUMN IF NOT EXISTS tracking_no text,
  ADD COLUMN IF NOT EXISTS shipped_at timestamptz;

COMMENT ON COLUMN public.sale_orders.web_fulfillment_status IS 'paid|packing|shipped|delivered — web channel only';
