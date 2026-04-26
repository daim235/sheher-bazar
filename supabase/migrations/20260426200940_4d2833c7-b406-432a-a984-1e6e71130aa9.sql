CREATE OR REPLACE FUNCTION public.increment_coupon_redemption_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.coupons
  SET redemption_count = redemption_count + 1,
      updated_at = now()
  WHERE id = NEW.coupon_id;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS increment_coupon_redemption_count_trigger ON public.coupon_redemptions;
CREATE TRIGGER increment_coupon_redemption_count_trigger
AFTER INSERT ON public.coupon_redemptions
FOR EACH ROW
EXECUTE FUNCTION public.increment_coupon_redemption_count();