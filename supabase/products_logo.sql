-- Persist optional uploaded logos on leaderboard listings.
-- Run once in the Supabase SQL Editor.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS logo_url TEXT;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-logos',
  'product-logos',
  true,
  1500000,
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Public read product logos'
  ) THEN
    CREATE POLICY "Public read product logos"
      ON storage.objects
      FOR SELECT
      USING (bucket_id = 'product-logos');
  END IF;
END
$$;
