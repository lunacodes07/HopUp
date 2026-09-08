-- Brand My Stanley: 12 paid spots on the cup. Hops replace the occupant.
-- Run once in the Supabase SQL Editor. Inventory: supabase/README.md.

CREATE TABLE IF NOT EXISTS public.stanley_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  slot_number INTEGER NOT NULL UNIQUE CHECK (slot_number BETWEEN 1 AND 12),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  price INTEGER NOT NULL,
  logo_url TEXT,
  payment_id TEXT UNIQUE
);

CREATE INDEX IF NOT EXISTS stanley_slots_slot_idx
  ON public.stanley_slots (slot_number);

ALTER TABLE public.stanley_slots ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'stanley_slots'
      AND policyname = 'Allow public read access'
  ) THEN
    CREATE POLICY "Allow public read access"
      ON public.stanley_slots
      FOR SELECT
      USING (true);
  END IF;
END
$$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.stanley_slots;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END
$$;

-- Referral sales can now attribute a Stanley checkout.
ALTER TABLE public.referral_sales
  DROP CONSTRAINT IF EXISTS referral_sales_kind_check;

ALTER TABLE public.referral_sales
  ADD CONSTRAINT referral_sales_kind_check
  CHECK (kind IN ('hop', 'sponsored', 'stanley'));
