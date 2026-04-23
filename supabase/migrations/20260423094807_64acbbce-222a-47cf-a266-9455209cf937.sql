-- When a vendor is approved, ensure they have at least one product so their shop shows up
CREATE OR REPLACE FUNCTION public.on_vendor_status_changed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.notifications (user_id, type, title, body, link, metadata)
    VALUES (
      NEW.owner_id,
      'approval_decision',
      CASE WHEN NEW.status = 'approved' THEN 'Your shop is approved 🎉'
           WHEN NEW.status = 'rejected' THEN 'Your shop application was rejected'
           ELSE 'Your shop status was updated' END,
      CASE WHEN NEW.status = 'rejected' THEN COALESCE(NEW.rejection_reason, 'Please contact support.')
           WHEN NEW.status = 'approved' THEN 'Your products are now visible on Shahar Bazar.'
           ELSE NULL END,
      '/dashboard',
      jsonb_build_object('vendor_id', NEW.id, 'status', NEW.status)
    );

    -- On approval, seed a starter showcase product if vendor has no products yet
    IF NEW.status = 'approved'
       AND NOT EXISTS (SELECT 1 FROM public.products WHERE vendor_id = NEW.id) THEN
      INSERT INTO public.products (vendor_id, name, description, price, image_url, stock, is_active)
      VALUES (
        NEW.id,
        NEW.shop_name,
        COALESCE(NEW.description, 'Welcome to ' || NEW.shop_name || ' on Shahar Bazar.'),
        0,
        NEW.logo_url,
        1,
        true
      );
    END IF;
  END IF;
  RETURN NEW;
END; $$;

-- When a provider is approved, ensure they have at least one service listing
CREATE OR REPLACE FUNCTION public.on_provider_application()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_title text;
BEGIN
  IF NEW.provider_status = 'pending' AND (OLD.provider_status IS DISTINCT FROM 'pending') THEN
    PERFORM public.notify_admins(
      'provider_application',
      'New service provider application',
      COALESCE(NEW.full_name, 'A user') || ' applied as a service provider.',
      '/admin?tab=providers',
      jsonb_build_object('user_id', NEW.id)
    );
  END IF;

  IF NEW.provider_status IS DISTINCT FROM OLD.provider_status
     AND NEW.provider_status IN ('approved', 'rejected') THEN
    INSERT INTO public.notifications (user_id, type, title, body, link, metadata)
    VALUES (
      NEW.id,
      'approval_decision',
      CASE WHEN NEW.provider_status = 'approved' THEN 'You are now an approved provider 🎉'
           ELSE 'Your provider application was rejected' END,
      CASE WHEN NEW.provider_status = 'rejected' THEN COALESCE(NEW.provider_rejection_reason, 'Please contact support.')
           ELSE 'Your services are now visible on Shahar Bazar.' END,
      '/dashboard',
      jsonb_build_object('status', NEW.provider_status)
    );

    -- On approval, seed a starter service so the provider shows up in /services
    IF NEW.provider_status = 'approved'
       AND NOT EXISTS (SELECT 1 FROM public.services WHERE provider_id = NEW.id) THEN
      v_title := COALESCE(
        NULLIF(split_part(COALESCE(NEW.provider_skills, ''), ',', 1), ''),
        COALESCE(NEW.full_name, 'Service') || ' — Service'
      );
      INSERT INTO public.services (
        provider_id, title, description, price, price_unit,
        city, image_url, is_active
      )
      VALUES (
        NEW.id,
        v_title,
        COALESCE(NEW.bio, 'Skills: ' || COALESCE(NEW.provider_skills, 'Available on request')),
        0,
        'per visit',
        NEW.city,
        NEW.avatar_url,
        true
      );
    END IF;
  END IF;
  RETURN NEW;
END; $$;

-- Make sure the triggers are attached (in case they were missing)
DROP TRIGGER IF EXISTS trg_on_vendor_status_changed ON public.vendors;
CREATE TRIGGER trg_on_vendor_status_changed
AFTER UPDATE ON public.vendors
FOR EACH ROW
EXECUTE FUNCTION public.on_vendor_status_changed();

DROP TRIGGER IF EXISTS trg_on_vendor_created ON public.vendors;
CREATE TRIGGER trg_on_vendor_created
AFTER INSERT ON public.vendors
FOR EACH ROW
EXECUTE FUNCTION public.on_vendor_created();

DROP TRIGGER IF EXISTS trg_on_provider_application ON public.profiles;
CREATE TRIGGER trg_on_provider_application
AFTER UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.on_provider_application();

DROP TRIGGER IF EXISTS trg_on_order_created ON public.orders;
CREATE TRIGGER trg_on_order_created
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.on_order_created();

DROP TRIGGER IF EXISTS trg_on_order_status_changed ON public.orders;
CREATE TRIGGER trg_on_order_status_changed
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.on_order_status_changed();

DROP TRIGGER IF EXISTS trg_on_booking_created ON public.bookings;
CREATE TRIGGER trg_on_booking_created
AFTER INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.on_booking_created();

DROP TRIGGER IF EXISTS trg_on_booking_status_changed ON public.bookings;
CREATE TRIGGER trg_on_booking_status_changed
AFTER UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.on_booking_status_changed();