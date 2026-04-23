-- Remove the permissive WITH CHECK (true) insert policy.
-- All notification inserts come from SECURITY DEFINER triggers, which bypass RLS.
DROP POLICY IF EXISTS "system insert notifications" ON public.notifications;

-- Optional: only admins can manually insert notifications (e.g. broadcasts from admin panel)
CREATE POLICY "admins insert notifications" ON public.notifications
FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));