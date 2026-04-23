-- ============== STOCK CONTROL ==============

CREATE OR REPLACE FUNCTION public.decrement_product_stock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stock integer;
  v_name text;
BEGIN
  SELECT stock, name INTO v_stock, v_name
  FROM public.products
  WHERE id = NEW.product_id
  FOR UPDATE;

  IF v_stock IS NULL THEN
    RAISE EXCEPTION 'Product no longer exists';
  END IF;

  IF v_stock < NEW.quantity THEN
    RAISE EXCEPTION 'Not enough stock for "%". Only % left.', v_name, v_stock;
  END IF;

  UPDATE public.products
  SET stock = stock - NEW.quantity,
      updated_at = now()
  WHERE id = NEW.product_id;

  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_decrement_stock ON public.order_items;
CREATE TRIGGER trg_decrement_stock
BEFORE INSERT ON public.order_items
FOR EACH ROW EXECUTE FUNCTION public.decrement_product_stock();

-- Restore stock when an order is cancelled
CREATE OR REPLACE FUNCTION public.restore_stock_on_cancel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status <> 'cancelled' THEN
    UPDATE public.products p
    SET stock = p.stock + oi.quantity,
        updated_at = now()
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id AND oi.product_id = p.id;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_restore_stock_on_cancel ON public.orders;
CREATE TRIGGER trg_restore_stock_on_cancel
AFTER UPDATE OF status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.restore_stock_on_cancel();

-- ============== ORDER STATUS TRANSITIONS ==============

CREATE OR REPLACE FUNCTION public.validate_order_status_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_vendor boolean;
  v_is_customer boolean;
  v_is_admin boolean;
  v_old text;
  v_new text;
BEGIN
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  v_old := OLD.status::text;
  v_new := NEW.status::text;

  v_is_admin := public.has_role(auth.uid(), 'admin');
  v_is_customer := (auth.uid() = NEW.customer_id);
  v_is_vendor := EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = NEW.vendor_id AND v.owner_id = auth.uid()
  );

  -- Admins can do anything
  IF v_is_admin THEN
    RETURN NEW;
  END IF;

  -- Terminal states cannot be changed (except by admin above)
  IF v_old IN ('delivered', 'cancelled') THEN
    RAISE EXCEPTION 'Order is % and cannot be modified.', v_old;
  END IF;

  -- Customer rules: can only cancel a pending order
  IF v_is_customer AND NOT v_is_vendor THEN
    IF v_new = 'cancelled' AND v_old = 'pending' THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Customers can only cancel pending orders.';
  END IF;

  -- Vendor rules: forward-only pipeline
  IF v_is_vendor THEN
    IF (v_old = 'pending'   AND v_new IN ('confirmed', 'cancelled'))
       OR (v_old = 'confirmed' AND v_new IN ('shipped', 'cancelled'))
       OR (v_old = 'shipped'   AND v_new = 'delivered') THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Invalid status change from % to %.', v_old, v_new;
  END IF;

  RAISE EXCEPTION 'You are not allowed to change this order.';
END; $$;

DROP TRIGGER IF EXISTS trg_validate_order_status ON public.orders;
CREATE TRIGGER trg_validate_order_status
BEFORE UPDATE OF status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.validate_order_status_transition();

-- ============== BOOKING STATUS TRANSITIONS ==============

CREATE OR REPLACE FUNCTION public.validate_booking_status_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_provider boolean;
  v_is_customer boolean;
  v_is_admin boolean;
  v_old text;
  v_new text;
BEGIN
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  v_old := OLD.status::text;
  v_new := NEW.status::text;
  v_is_admin := public.has_role(auth.uid(), 'admin');
  v_is_customer := (auth.uid() = NEW.customer_id);
  v_is_provider := (auth.uid() = NEW.provider_id);

  IF v_is_admin THEN
    RETURN NEW;
  END IF;

  IF v_old IN ('completed', 'cancelled') THEN
    RAISE EXCEPTION 'Booking is % and cannot be modified.', v_old;
  END IF;

  IF v_is_customer AND NOT v_is_provider THEN
    IF v_new = 'cancelled' AND v_old IN ('pending', 'confirmed') THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Customers can only cancel pending or confirmed bookings.';
  END IF;

  IF v_is_provider THEN
    IF (v_old = 'pending'   AND v_new IN ('confirmed', 'cancelled'))
       OR (v_old = 'confirmed' AND v_new IN ('completed', 'cancelled')) THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Invalid status change from % to %.', v_old, v_new;
  END IF;

  RAISE EXCEPTION 'You are not allowed to change this booking.';
END; $$;

DROP TRIGGER IF EXISTS trg_validate_booking_status ON public.bookings;
CREATE TRIGGER trg_validate_booking_status
BEFORE UPDATE OF status ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.validate_booking_status_transition();