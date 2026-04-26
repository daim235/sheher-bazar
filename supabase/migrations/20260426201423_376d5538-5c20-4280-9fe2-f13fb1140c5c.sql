ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP WITH TIME ZONE;

UPDATE public.orders
SET confirmed_at = COALESCE(confirmed_at, updated_at, created_at)
WHERE status IN ('confirmed', 'shipped', 'delivered')
  AND confirmed_at IS NULL;

UPDATE public.orders
SET shipped_at = COALESCE(shipped_at, updated_at, created_at)
WHERE status IN ('shipped', 'delivered')
  AND shipped_at IS NULL;

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

  IF NEW.status = 'confirmed' AND NEW.confirmed_at IS NULL THEN
    NEW.confirmed_at := now();
  END IF;

  IF NEW.status = 'shipped' THEN
    IF NEW.confirmed_at IS NULL THEN
      NEW.confirmed_at := now();
    END IF;
    IF NEW.shipped_at IS NULL THEN
      NEW.shipped_at := now();
    END IF;
  END IF;

  IF NEW.status = 'delivered' THEN
    IF NEW.confirmed_at IS NULL THEN
      NEW.confirmed_at := now();
    END IF;
    IF NEW.shipped_at IS NULL THEN
      NEW.shipped_at := now();
    END IF;
    IF NEW.delivered_at IS NULL THEN
      NEW.delivered_at := now();
    END IF;
  END IF;

  IF NEW.status = 'cancelled' THEN
    NEW.payment_status := 'cancelled';
  ELSIF NEW.status = 'delivered' AND NEW.payment_method = 'cod' THEN
    NEW.payment_status := 'paid';
  END IF;

  RETURN NEW;
END;
$function$;