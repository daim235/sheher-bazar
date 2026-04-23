
-- Drop any overly-permissive list policies on profile-images.
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND (qual ILIKE '%profile-images%' OR with_check ILIKE '%profile-images%')
      AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- Owners can list/manage their own files (folder = user id).
CREATE POLICY "profile-images owners read"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'profile-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "profile-images owners insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "profile-images owners update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "profile-images owners delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
