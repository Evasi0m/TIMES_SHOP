-- Restore promo usage when a web order is cancelled

CREATE OR REPLACE FUNCTION public.decrement_promo_usage(p_order_id bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec record;
BEGIN
  IF p_order_id IS NULL THEN
    RETURN;
  END IF;

  FOR rec IN
    SELECT promo_code_id
    FROM public.promo_redemptions
    WHERE order_id = p_order_id
      AND reversed_at IS NULL
  LOOP
    UPDATE public.promo_codes
    SET used_count = GREATEST(0, used_count - 1),
        updated_at = now()
    WHERE id = rec.promo_code_id;

    UPDATE public.promo_redemptions
    SET reversed_at = now()
    WHERE order_id = p_order_id
      AND promo_code_id = rec.promo_code_id
      AND reversed_at IS NULL;
  END LOOP;
END;
$$;
