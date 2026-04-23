-- Add contact email column to vendors
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS contact_email text;

-- Add contact email column to profiles for service providers
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS contact_email text;

-- Update apply_as_provider RPC to accept email
CREATE OR REPLACE FUNCTION public.apply_as_provider(
  _skills text,
  _bio text DEFAULT NULL,
  _phone text DEFAULT NULL,
  _city text DEFAULT NULL,
  _email text DEFAULT NULL
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
      contact_email = COALESCE(_email, contact_email),
      updated_at = now()
  WHERE id = auth.uid()
  RETURNING * INTO p;
  RETURN p;
END; $$;