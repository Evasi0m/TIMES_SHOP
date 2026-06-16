-- Hybrid B Phase 1: Shop project foundation (auth roles, customer data, promos, settings)

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.auth_app_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(auth.jwt() -> 'app_metadata' ->> 'app_role', '');
$$;

CREATE OR REPLACE FUNCTION public.auth_is_shop_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.auth_app_role() IN ('admin', 'super_admin');
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.customer_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  phone text,
  default_address_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text,
  recipient_name text NOT NULL,
  phone text NOT NULL,
  address_line text NOT NULL,
  subdistrict text,
  district text,
  province text NOT NULL,
  postal_code text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_profiles
  DROP CONSTRAINT IF EXISTS customer_profiles_default_address_id_fkey;
ALTER TABLE public.customer_profiles
  ADD CONSTRAINT customer_profiles_default_address_id_fkey
  FOREIGN KEY (default_address_id) REFERENCES public.customer_addresses(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.shop_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  shipping_fee numeric(12, 2) NOT NULL DEFAULT 50,
  shipping_label text NOT NULL DEFAULT 'ค่าจัดส่งมาตรฐาน',
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.shop_settings (id, shipping_fee, shipping_label)
VALUES (1, 50, 'ค่าจัดส่งมาตรฐาน')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.shop_bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name text NOT NULL,
  account_number text NOT NULL,
  account_name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  internal_code text NOT NULL UNIQUE,
  display_name text NOT NULL,
  promo_type text NOT NULL CHECK (
    promo_type IN ('product_discount', 'free_shipping', 'cod_discount', 'special_discount')
  ),
  discount_mode text CHECK (discount_mode IS NULL OR discount_mode IN ('percent', 'amount')),
  discount_value numeric(12, 2) NOT NULL DEFAULT 0,
  min_order numeric(12, 2) NOT NULL DEFAULT 0,
  starts_at timestamptz,
  expires_at timestamptz,
  max_uses integer,
  used_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  distribution text NOT NULL DEFAULT 'draft' CHECK (
    distribution IN ('draft', 'broadcast', 'targeted')
  ),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.promo_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id uuid NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  UNIQUE (promo_code_id, user_id)
);

CREATE INDEX IF NOT EXISTS promo_grants_user_active_idx
  ON public.promo_grants (user_id)
  WHERE revoked_at IS NULL;

-- ---------------------------------------------------------------------------
-- Auth bootstrap — email allowlist (Hybrid B)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_shop_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF lower(coalesce(NEW.email, '')) = 'true.wifi8888@gmail.com' THEN
    NEW.raw_app_meta_data :=
      coalesce(NEW.raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('app_role', 'admin');
  ELSE
    NEW.raw_app_meta_data :=
      coalesce(NEW.raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('app_role', 'customer');
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_shop_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.customer_profiles (user_id, display_name)
  VALUES (
    NEW.id,
    nullif(trim(coalesce(NEW.raw_user_meta_data ->> 'display_name', '')), '')
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_shop ON auth.users;
CREATE TRIGGER on_auth_user_created_shop
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_shop_user();

DROP TRIGGER IF EXISTS on_auth_user_created_shop_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_shop_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_shop_user_profile();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_grants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS customer_profiles_select_own ON public.customer_profiles;
CREATE POLICY customer_profiles_select_own ON public.customer_profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.auth_is_shop_admin());

DROP POLICY IF EXISTS customer_profiles_update_own ON public.customer_profiles;
CREATE POLICY customer_profiles_update_own ON public.customer_profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS customer_profiles_insert_own ON public.customer_profiles;
CREATE POLICY customer_profiles_insert_own ON public.customer_profiles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS customer_addresses_all_own ON public.customer_addresses;
CREATE POLICY customer_addresses_all_own ON public.customer_addresses
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.auth_is_shop_admin())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS shop_settings_admin ON public.shop_settings;
CREATE POLICY shop_settings_admin ON public.shop_settings
  FOR ALL TO authenticated
  USING (public.auth_is_shop_admin())
  WITH CHECK (public.auth_is_shop_admin());

DROP POLICY IF EXISTS shop_bank_accounts_admin ON public.shop_bank_accounts;
CREATE POLICY shop_bank_accounts_admin ON public.shop_bank_accounts
  FOR ALL TO authenticated
  USING (public.auth_is_shop_admin())
  WITH CHECK (public.auth_is_shop_admin());

DROP POLICY IF EXISTS promo_codes_admin ON public.promo_codes;
CREATE POLICY promo_codes_admin ON public.promo_codes
  FOR ALL TO authenticated
  USING (public.auth_is_shop_admin())
  WITH CHECK (public.auth_is_shop_admin());

DROP POLICY IF EXISTS promo_grants_admin ON public.promo_grants;
CREATE POLICY promo_grants_admin ON public.promo_grants
  FOR ALL TO authenticated
  USING (public.auth_is_shop_admin())
  WITH CHECK (public.auth_is_shop_admin());

DROP POLICY IF EXISTS promo_grants_select_own ON public.promo_grants;
CREATE POLICY promo_grants_select_own ON public.promo_grants
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP TRIGGER IF EXISTS customer_profiles_updated_at ON public.customer_profiles;
CREATE TRIGGER customer_profiles_updated_at
  BEFORE UPDATE ON public.customer_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS shop_settings_updated_at ON public.shop_settings;
CREATE TRIGGER shop_settings_updated_at
  BEFORE UPDATE ON public.shop_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS promo_codes_updated_at ON public.promo_codes;
CREATE TRIGGER promo_codes_updated_at
  BEFORE UPDATE ON public.promo_codes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
