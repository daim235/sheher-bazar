ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS subtotal numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_total numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_fee numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'cod',
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS courier_name text,
  ADD COLUMN IF NOT EXISTS tracking_number text,
  ADD COLUMN IF NOT EXISTS estimated_delivery_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS delivered_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS commission_pct numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission_amount numeric NOT NULL DEFAULT 0;

UPDATE public.orders
SET subtotal = CASE WHEN subtotal = 0 THEN total ELSE subtotal END
WHERE subtotal = 0;

CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON public.orders(status, created_at DESC);

CREATE OR REPLACE FUNCTION public.compute_order_totals_and_commission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_pct numeric;
BEGIN
  SELECT vendor_commission_pct INTO v_pct
  FROM public.platform_settings
  ORDER BY updated_at DESC
  LIMIT 1;

  IF v_pct IS NULL THEN
    v_pct := 0;
  END IF;

  IF NEW.subtotal = 0 THEN
    NEW.subtotal := COALESCE(NEW.total, 0) + COALESCE(NEW.discount_total, 0) - COALESCE(NEW.delivery_fee, 0);
  END IF;

  NEW.total := GREATEST(COALESCE(NEW.subtotal, 0) - COALESCE(NEW.discount_total, 0) + COALESCE(NEW.delivery_fee, 0), 0);
  NEW.commission_pct := v_pct;
  NEW.commission_amount := ROUND((COALESCE(NEW.total, 0) * v_pct) / 100.0, 2);

  IF NEW.status = 'delivered' AND NEW.delivered_at IS NULL THEN
    NEW.delivered_at := now();
  END IF;

  IF NEW.status = 'cancelled' THEN
    NEW.payment_status := 'cancelled';
  ELSIF NEW.status = 'delivered' AND NEW.payment_method = 'cod' THEN
    NEW.payment_status := 'paid';
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS compute_order_totals_and_commission_trigger ON public.orders;
CREATE TRIGGER compute_order_totals_and_commission_trigger
BEFORE INSERT OR UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.compute_order_totals_and_commission();