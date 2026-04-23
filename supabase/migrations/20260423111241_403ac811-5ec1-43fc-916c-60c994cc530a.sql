-- Create public storage bucket for profile, shop and banner images
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- Add avatar_url to profiles if missing (it already exists, but safe-guard)
-- (no-op since column exists)

-- Storage RLS policies: users manage their own folder (prefix = auth.uid())
CREATE POLICY "Profile images are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-images');

CREATE POLICY "Users can upload their own profile images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own profile images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own profile images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);