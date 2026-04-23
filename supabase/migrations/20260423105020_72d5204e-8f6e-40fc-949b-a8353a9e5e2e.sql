
-- Platform settings (singleton)
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_commission_pct numeric NOT NULL DEFAULT 10,
  vendor_commission_pct numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings readable" ON public.platform_settings FOR SELECT USING (true);
CREATE POLICY "admins update settings" ON public.platform_settings FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins insert settings" ON public.platform_settings FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed singleton row
INSERT INTO public.platform_settings (booking_commission_pct, vendor_commission_pct)
SELECT 10, 0
WHERE NOT EXISTS (SELECT 1 FROM public.platform_settings);

-- Booking pricing fields
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS agreed_price numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission_pct numeric NOT NULL DEFAULT 10;

-- Auto-fill agreed_price from service & compute commission
CREATE OR REPLACE FUNCTION public.compute_booking_commission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pct numeric;
  v_price numeric;
BEGIN
  SELECT booking_commission_pct INTO v_pct FROM public.platform_settings ORDER BY updated_at DESC LIMIT 1;
  IF v_pct IS NULL THEN v_pct := 10; END IF;

  IF (TG_OP = 'INSERT' AND (NEW.agreed_price IS NULL OR NEW.agreed_price = 0)) THEN
    SELECT price INTO v_price FROM public.services WHERE id = NEW.service_id;
    NEW.agreed_price := COALESCE(v_price, 0);
  END IF;

  NEW.commission_pct := v_pct;
  NEW.commission_amount := ROUND((COALESCE(NEW.agreed_price, 0) * v_pct) / 100.0, 2);
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_booking_commission ON public.bookings;
CREATE TRIGGER trg_booking_commission
  BEFORE INSERT OR UPDATE OF agreed_price ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.compute_booking_commission();

-- Wire existing booking-status notification trigger (was defined but never attached)
DROP TRIGGER IF EXISTS trg_on_booking_created ON public.bookings;
CREATE TRIGGER trg_on_booking_created
  AFTER INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.on_booking_created();

DROP TRIGGER IF EXISTS trg_on_booking_status_changed ON public.bookings;
CREATE TRIGGER trg_on_booking_status_changed
  AFTER UPDATE OF status ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.on_booking_status_changed();

-- Wire vendor/provider/order triggers similarly (in case they aren't attached)
DROP TRIGGER IF EXISTS trg_on_vendor_created ON public.vendors;
CREATE TRIGGER trg_on_vendor_created
  AFTER INSERT ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION public.on_vendor_created();

DROP TRIGGER IF EXISTS trg_on_vendor_status_changed ON public.vendors;
CREATE TRIGGER trg_on_vendor_status_changed
  AFTER UPDATE OF status ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION public.on_vendor_status_changed();

DROP TRIGGER IF EXISTS trg_on_provider_application ON public.profiles;
CREATE TRIGGER trg_on_provider_application
  AFTER UPDATE OF provider_status ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.on_provider_application();

DROP TRIGGER IF EXISTS trg_on_order_created ON public.orders;
CREATE TRIGGER trg_on_order_created
  AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.on_order_created();

DROP TRIGGER IF EXISTS trg_on_order_status_changed ON public.orders;
CREATE TRIGGER trg_on_order_status_changed
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.on_order_status_changed();
