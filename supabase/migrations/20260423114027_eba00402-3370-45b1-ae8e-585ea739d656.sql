ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS default_address text,
  ADD COLUMN IF NOT EXISTS default_phone text;