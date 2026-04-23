-- =========================================================
-- 1. Approval status enums
-- =========================================================
CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.provider_status AS ENUM ('none', 'pending', 'approved', 'rejected');
CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled');

-- =========================================================
-- 2. Add status fields
-- =========================================================
ALTER TABLE public.vendors
  ADD COLUMN status public.approval_status NOT NULL DEFAULT 'pending',
  ADD COLUMN rejection_reason text,
  ADD COLUMN reviewed_by uuid,
  ADD COLUMN reviewed_at timestamptz;

ALTER TABLE public.profiles
  ADD COLUMN provider_status public.provider_status NOT NULL DEFAULT 'none',
  ADD COLUMN provider_applied_at timestamptz,
  ADD COLUMN provider_reviewed_by uuid,
  ADD COLUMN provider_reviewed_at timestamptz,
  ADD COLUMN provider_rejection_reason text,
  ADD COLUMN provider_skills text;

-- Default existing vendors to approved so current data keeps working
UPDATE public.vendors SET status = 'approved' WHERE status = 'pending';

-- Mark existing service owners as approved providers
UPDATE public.profiles p
SET provider_status = 'approved'
WHERE EXISTS (SELECT 1 FROM public.services s WHERE s.provider_id = p.id);

-- =========================================================
-- 3. Helper functions
-- =========================================================
CREATE OR REPLACE FUNCTION public.is_approved_provider(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND provider_status = 'approved'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_approved_vendor(_vendor_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.vendors
    WHERE id = _vendor_id AND status = 'approved'
  )
$$;

-- =========================================================
-- 4. Update RLS: products only visible if vendor approved
-- =========================================================
DROP POLICY IF EXISTS "active products readable" ON public.products;
CREATE POLICY "active products readable" ON public.products
FOR SELECT USING (
  (is_active AND public.is_approved_vendor(vendor_id))
  OR EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = products.vendor_id AND v.owner_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

-- Services only visible if provider approved
DROP POLICY IF EXISTS "active services readable" ON public.services;
CREATE POLICY "active services readable" ON public.services
FOR SELECT USING (
  (is_active AND public.is_approved_provider(provider_id))
  OR auth.uid() = provider_id
  OR public.has_role(auth.uid(), 'admin')
);

-- Vendors only listable publicly if approved
DROP POLICY IF EXISTS "vendors readable" ON public.vendors;
CREATE POLICY "vendors readable" ON public.vendors
FOR SELECT USING (
  status = 'approved'
  OR auth.uid() = owner_id
  OR public.has_role(auth.uid(), 'admin')
);

-- Admins can update any vendor (for approval). Existing owner update policy still applies.
CREATE POLICY "admins update vendors" ON public.vendors
FOR UPDATE USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can update any profile (for approval)
CREATE POLICY "admins update profiles" ON public.profiles
FOR UPDATE USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- 5. Notifications
-- =========================================================
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL, -- 'vendor_application' | 'provider_application' | 'order' | 'booking' | 'approval_decision'
  title text NOT NULL,
  body text,
  link text,
  metadata jsonb DEFAULT '{}'::jsonb,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users see own notifications" ON public.notifications
FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "users update own notifications" ON public.notifications
FOR UPDATE USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "system insert notifications" ON public.notifications
FOR INSERT WITH CHECK (true); -- inserts come from triggers (security definer)

CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, read, created_at DESC);

-- Helper to fan out a notification to all admins
CREATE OR REPLACE FUNCTION public.notify_admins(_type text, _title text, _body text, _link text, _metadata jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, link, metadata)
  SELECT user_id, _type, _title, _body, _link, COALESCE(_metadata, '{}'::jsonb)
  FROM public.user_roles WHERE role = 'admin';
END; $$;

-- Trigger: notify admins when vendor created (pending)
CREATE OR REPLACE FUNCTION public.on_vendor_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'pending' THEN
    PERFORM public.notify_admins(
      'vendor_application',
      'New vendor application',
      'Shop "' || NEW.shop_name || '" is awaiting approval.',
      '/admin?tab=vendors',
      jsonb_build_object('vendor_id', NEW.id, 'owner_id', NEW.owner_id)
    );
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_vendor_created
AFTER INSERT ON public.vendors
FOR EACH ROW EXECUTE FUNCTION public.on_vendor_created();

-- Trigger: notify owner when vendor approval status changes
CREATE OR REPLACE FUNCTION public.on_vendor_status_changed()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_vendor_status_changed
AFTER UPDATE ON public.vendors
FOR EACH ROW EXECUTE FUNCTION public.on_vendor_status_changed();

-- Trigger: notify admins when profile becomes pending provider
CREATE OR REPLACE FUNCTION public.on_provider_application()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_provider_application
AFTER UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.on_provider_application();

-- =========================================================
-- 6. Orders & order items
-- =========================================================
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE RESTRICT,
  status public.order_status NOT NULL DEFAULT 'pending',
  total numeric NOT NULL DEFAULT 0,
  shipping_address text,
  phone text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric NOT NULL,
  product_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_customer ON public.orders(customer_id, created_at DESC);
CREATE INDEX idx_orders_vendor ON public.orders(vendor_id, created_at DESC);
CREATE INDEX idx_order_items_order ON public.order_items(order_id);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Helper: is the auth user the vendor owner of this order?
CREATE OR REPLACE FUNCTION public.is_order_vendor(_order_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.vendors v ON v.id = o.vendor_id
    WHERE o.id = _order_id AND v.owner_id = _user_id
  )
$$;

-- Orders policies
CREATE POLICY "customers create orders" ON public.orders
FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "participants view orders" ON public.orders
FOR SELECT USING (
  auth.uid() = customer_id
  OR EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = orders.vendor_id AND v.owner_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "vendor or customer update orders" ON public.orders
FOR UPDATE USING (
  auth.uid() = customer_id
  OR EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = orders.vendor_id AND v.owner_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

-- Order items policies
CREATE POLICY "customers add items to own order" ON public.order_items
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.customer_id = auth.uid())
);

CREATE POLICY "participants view order items" ON public.order_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    LEFT JOIN public.vendors v ON v.id = o.vendor_id
    WHERE o.id = order_items.order_id
      AND (o.customer_id = auth.uid() OR v.owner_id = auth.uid())
  )
  OR public.has_role(auth.uid(), 'admin')
);

-- updated_at trigger for orders
CREATE TRIGGER trg_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Notify vendor when new order placed
CREATE OR REPLACE FUNCTION public.on_order_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_owner uuid;
  v_shop text;
BEGIN
  SELECT owner_id, shop_name INTO v_owner, v_shop FROM public.vendors WHERE id = NEW.vendor_id;
  IF v_owner IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, link, metadata)
    VALUES (
      v_owner,
      'order',
      'New order received',
      'You have a new pending order at ' || v_shop || '.',
      '/dashboard?tab=orders',
      jsonb_build_object('order_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_order_created
AFTER INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.on_order_created();

-- Notify customer when order status changes
CREATE OR REPLACE FUNCTION public.on_order_status_changed()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.notifications (user_id, type, title, body, link, metadata)
    VALUES (
      NEW.customer_id,
      'order',
      'Order ' || NEW.status,
      'Your order status was updated to ' || NEW.status || '.',
      '/dashboard?tab=orders',
      jsonb_build_object('order_id', NEW.id, 'status', NEW.status)
    );
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_order_status_changed
AFTER UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.on_order_status_changed();

-- =========================================================
-- 7. Booking notifications
-- =========================================================
-- Add 'accepted' to booking_status (existing enum already has confirmed which we'll treat as accepted)
-- Notify provider on new booking
CREATE OR REPLACE FUNCTION public.on_booking_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_title text;
BEGIN
  SELECT title INTO v_title FROM public.services WHERE id = NEW.service_id;
  INSERT INTO public.notifications (user_id, type, title, body, link, metadata)
  VALUES (
    NEW.provider_id,
    'booking',
    'New booking request',
    'You have a new booking request for ' || COALESCE(v_title, 'your service') || '.',
    '/dashboard?tab=bookings',
    jsonb_build_object('booking_id', NEW.id)
  );
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_booking_created
AFTER INSERT ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.on_booking_created();

-- Notify customer on booking status change
CREATE OR REPLACE FUNCTION public.on_booking_status_changed()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.notifications (user_id, type, title, body, link, metadata)
    VALUES (
      NEW.customer_id,
      'booking',
      'Booking ' || NEW.status,
      'Your booking status was updated to ' || NEW.status || '.',
      '/dashboard?tab=bookings',
      jsonb_build_object('booking_id', NEW.id, 'status', NEW.status)
    );
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_booking_status_changed
AFTER UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.on_booking_status_changed();

-- =========================================================
-- 8. Helper RPCs for atomic approval (so admin UI can call cleanly)
-- =========================================================
CREATE OR REPLACE FUNCTION public.admin_set_vendor_status(_vendor_id uuid, _status public.approval_status, _reason text DEFAULT NULL)
RETURNS public.vendors LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v public.vendors;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  UPDATE public.vendors
  SET status = _status,
      rejection_reason = CASE WHEN _status = 'rejected' THEN _reason ELSE NULL END,
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      updated_at = now()
  WHERE id = _vendor_id
  RETURNING * INTO v;
  -- if approved, also grant 'vendor' role
  IF _status = 'approved' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (v.owner_id, 'vendor')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN v;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_set_provider_status(_user_id uuid, _status public.provider_status, _reason text DEFAULT NULL)
RETURNS public.profiles LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.profiles;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  UPDATE public.profiles
  SET provider_status = _status,
      provider_rejection_reason = CASE WHEN _status = 'rejected' THEN _reason ELSE NULL END,
      provider_reviewed_by = auth.uid(),
      provider_reviewed_at = now(),
      updated_at = now()
  WHERE id = _user_id
  RETURNING * INTO p;
  IF _status = 'approved' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (p.id, 'provider')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN p;
END; $$;

-- Apply as service provider (callable by any authenticated user)
CREATE OR REPLACE FUNCTION public.apply_as_provider(_skills text, _bio text DEFAULT NULL, _phone text DEFAULT NULL, _city text DEFAULT NULL)
RETURNS public.profiles LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.profiles;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;
  UPDATE public.profiles
  SET provider_status = 'pending',
      provider_applied_at = now(),
      provider_skills = COALESCE(_skills, provider_skills),
      bio = COALESCE(_bio, bio),
      phone = COALESCE(_phone, phone),
      city = COALESCE(_city, city),
      updated_at = now()
  WHERE id = auth.uid()
  RETURNING * INTO p;
  RETURN p;
END; $$;