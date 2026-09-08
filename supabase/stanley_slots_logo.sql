-- Persist optional uploaded logos on Brand My Stanley spots.
-- Run once in the Supabase SQL Editor after stanley_slots.sql.

ALTER TABLE public.stanley_slots
  ADD COLUMN IF NOT EXISTS logo_url TEXT;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'stanley-logos',
  'stanley-logos',
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
      AND policyname = 'Public read stanley logos'
  ) THEN
    CREATE POLICY "Public read stanley logos"
      ON storage.objects
      FOR SELECT
      USING (bucket_id = 'stanley-logos');
  END IF;
END
$$;
