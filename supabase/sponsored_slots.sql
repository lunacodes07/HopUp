-- Sponsored placements: 4 time-boxed spots, independent of the hop leaderboard.
-- Run once in the Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS public.sponsored_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  slot_number INTEGER NOT NULL CHECK (slot_number BETWEEN 1 AND 4),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  url TEXT NOT NULL,
  clicks INTEGER DEFAULT 0 NOT NULL,
  price INTEGER NOT NULL,
  weeks INTEGER NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  payment_id TEXT UNIQUE
);

CREATE INDEX IF NOT EXISTS sponsored_slots_active_idx
  ON public.sponsored_slots (slot_number, expires_at);

-- One active booking per slot. Rejects overlapping dates on the same slot_number.
CREATE EXTENSION IF NOT EXISTS btree_gist;

DO $$
BEGIN
  ALTER TABLE public.sponsored_slots
    ADD CONSTRAINT sponsored_slots_no_overlap
    EXCLUDE USING gist (
      slot_number WITH =,
      tstzrange(created_at, expires_at, '[)') WITH &&
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

ALTER TABLE public.sponsored_slots ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'sponsored_slots'
      AND policyname = 'Allow public read access'
  ) THEN
    CREATE POLICY "Allow public read access"
      ON public.sponsored_slots
      FOR SELECT
      USING (true);
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.increment_sponsored_clicks(p_slot_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.sponsored_slots SET clicks = clicks + 1 WHERE id = p_slot_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_sponsored_clicks(UUID) TO anon, authenticated;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.sponsored_slots;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END
$$;
