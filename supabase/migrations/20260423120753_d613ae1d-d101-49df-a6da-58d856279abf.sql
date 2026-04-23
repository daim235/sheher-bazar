
-- 1. Unread message tracking
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS read_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_messages_convo_created ON public.messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON public.messages(conversation_id, sender_id) WHERE read_at IS NULL;

-- 2. Verified vendor badge
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false;

-- 3. Reports table
CREATE TYPE public.report_target AS ENUM ('product', 'shop', 'service', 'user', 'review');
CREATE TYPE public.report_status AS ENUM ('open', 'reviewing', 'resolved', 'dismissed');

CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  target_type public.report_target NOT NULL,
  target_id uuid NOT NULL,
  reason text NOT NULL,
  details text,
  status public.report_status NOT NULL DEFAULT 'open',
  admin_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_reports_status ON public.reports(status, created_at DESC);
CREATE INDEX idx_reports_target ON public.reports(target_type, target_id);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users create reports" ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "users see own reports" ON public.reports
  FOR SELECT USING (auth.uid() = reporter_id OR has_role(auth.uid(), 'admin'));
CREATE POLICY "admins update reports" ON public.reports
  FOR UPDATE USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_reports_updated BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. Refund requests
CREATE TYPE public.refund_status AS ENUM ('pending', 'approved', 'rejected', 'refunded');

CREATE TABLE public.refund_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  customer_id uuid NOT NULL,
  vendor_id uuid NOT NULL,
  reason text NOT NULL,
  details text,
  amount numeric NOT NULL DEFAULT 0,
  status public.refund_status NOT NULL DEFAULT 'pending',
  vendor_response text,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_refunds_order ON public.refund_requests(order_id);
CREATE INDEX idx_refunds_status ON public.refund_requests(status, created_at DESC);

ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer create refund" ON public.refund_requests
  FOR INSERT WITH CHECK (
    auth.uid() = customer_id
    AND EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.customer_id = auth.uid())
  );
CREATE POLICY "participants view refund" ON public.refund_requests
  FOR SELECT USING (
    auth.uid() = customer_id
    OR EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.owner_id = auth.uid())
    OR has_role(auth.uid(), 'admin')
  );
CREATE POLICY "vendor or admin update refund" ON public.refund_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.owner_id = auth.uid())
    OR has_role(auth.uid(), 'admin')
  );

CREATE TRIGGER trg_refunds_updated BEFORE UPDATE ON public.refund_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. Coupons
CREATE TYPE public.discount_type AS ENUM ('percent', 'fixed');

CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL,
  code text NOT NULL,
  discount_type public.discount_type NOT NULL DEFAULT 'percent',
  discount_value numeric NOT NULL DEFAULT 0,
  min_order_amount numeric NOT NULL DEFAULT 0,
  max_redemptions integer,
  redemption_count integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (vendor_id, code)
);
CREATE INDEX idx_coupons_active ON public.coupons(vendor_id, is_active);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "active coupons readable" ON public.coupons
  FOR SELECT USING (
    is_active
    OR EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.owner_id = auth.uid())
    OR has_role(auth.uid(), 'admin')
  );
CREATE POLICY "vendors manage own coupons" ON public.coupons
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.owner_id = auth.uid()));

CREATE TRIGGER trg_coupons_updated BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. Coupon redemption log
CREATE TABLE public.coupon_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL,
  customer_id uuid NOT NULL,
  order_id uuid NOT NULL,
  amount_off numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (coupon_id, order_id)
);

ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer or vendor view redemption" ON public.coupon_redemptions
  FOR SELECT USING (
    auth.uid() = customer_id
    OR EXISTS (
      SELECT 1 FROM public.coupons c JOIN public.vendors v ON v.id = c.vendor_id
      WHERE c.id = coupon_id AND v.owner_id = auth.uid()
    )
    OR has_role(auth.uid(), 'admin')
  );
CREATE POLICY "customer create redemption" ON public.coupon_redemptions
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- 7. Notify admins when a report is filed
CREATE OR REPLACE FUNCTION public.on_report_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.notify_admins(
    'report',
    'New report filed',
    'A ' || NEW.target_type || ' was reported. Reason: ' || NEW.reason,
    '/admin?tab=reports',
    jsonb_build_object('report_id', NEW.id, 'target_type', NEW.target_type, 'target_id', NEW.target_id)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_report_created AFTER INSERT ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.on_report_created();

-- 8. Notify vendor when refund requested + customer when status changes
CREATE OR REPLACE FUNCTION public.on_refund_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_owner uuid;
BEGIN
  SELECT owner_id INTO v_owner FROM public.vendors WHERE id = NEW.vendor_id;
  IF v_owner IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, link, metadata)
    VALUES (v_owner, 'refund', 'New refund request',
      'A customer requested a refund of Rs ' || NEW.amount || '.',
      '/dashboard?tab=orders',
      jsonb_build_object('refund_id', NEW.id, 'order_id', NEW.order_id));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_refund_created AFTER INSERT ON public.refund_requests
  FOR EACH ROW EXECUTE FUNCTION public.on_refund_created();

CREATE OR REPLACE FUNCTION public.on_refund_status_changed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.notifications (user_id, type, title, body, link, metadata)
    VALUES (NEW.customer_id, 'refund', 'Refund ' || NEW.status,
      'Your refund request was ' || NEW.status || '.',
      '/dashboard?tab=my-orders',
      jsonb_build_object('refund_id', NEW.id, 'order_id', NEW.order_id, 'status', NEW.status));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_refund_status_changed AFTER UPDATE ON public.refund_requests
  FOR EACH ROW EXECUTE FUNCTION public.on_refund_status_changed();

-- 9. Bump conversations.last_message_at automatically when a new message is inserted
CREATE OR REPLACE FUNCTION public.bump_conversation_on_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversations
     SET last_message_at = NEW.created_at
   WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_bump_conversation AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.bump_conversation_on_message();

-- 10. Allow recipients to mark messages as read (UPDATE policy)
CREATE POLICY "recipient marks message read" ON public.messages
  FOR UPDATE USING (
    is_convo_participant(conversation_id, auth.uid())
    AND sender_id <> auth.uid()
  );

-- 11. Realtime publication for messages and conversations
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 12. Low-stock alert: notify vendor when a product drops below 5 in stock
CREATE OR REPLACE FUNCTION public.notify_low_stock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_owner uuid;
BEGIN
  IF NEW.stock < 5 AND (OLD.stock IS NULL OR OLD.stock >= 5) THEN
    SELECT owner_id INTO v_owner FROM public.vendors WHERE id = NEW.vendor_id;
    IF v_owner IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, title, body, link, metadata)
      VALUES (v_owner, 'low_stock', 'Low stock alert',
        '"' || NEW.name || '" has only ' || NEW.stock || ' left.',
        '/dashboard?tab=products',
        jsonb_build_object('product_id', NEW.id, 'stock', NEW.stock));
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_low_stock AFTER UPDATE OF stock ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.notify_low_stock();
