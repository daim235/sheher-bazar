-- 1. Remove the over-permissive "everyone can read everything" policy
DROP POLICY IF EXISTS "profiles readable by all" ON public.profiles;

-- 2. Owners and admins can read their own full profile
CREATE POLICY "users read own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));

-- 3. Public-safe view exposing only non-sensitive fields.
--    Used by /services listing, provider cards, etc.
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = true) AS
SELECT
  id,
  full_name,
  avatar_url,
  city,
  bio,
  provider_status,
  provider_skills
FROM public.profiles
WHERE provider_status = 'approved' OR id = auth.uid();

GRANT SELECT ON public.public_profiles TO anon, authenticated;