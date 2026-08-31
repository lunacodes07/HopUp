-- Create products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  rank INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  clicks INTEGER DEFAULT 0 NOT NULL,
  price INTEGER NOT NULL,
  url TEXT,
  last_hopped_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Allow public read access
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON products FOR SELECT USING (true);

-- Create analytics table (for total visits)
CREATE TABLE analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  total_visits INTEGER DEFAULT 0 NOT NULL
);

-- Insert initial analytics row
INSERT INTO analytics (total_visits) VALUES (0);

-- Allow public read access
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON analytics FOR SELECT USING (true);

-- Create RPC to atomically increment a product's click counter.
-- SECURITY DEFINER bypasses RLS so anonymous visitors can track clicks,
-- and "clicks = clicks + 1" makes the increment atomic server-side
-- (concurrent visitors can no longer overwrite each other's counts).
CREATE OR REPLACE FUNCTION increment_clicks(p_product_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE products SET clicks = clicks + 1 WHERE id = p_product_id;
END;
$$;


-- Create RPC to increment page views
CREATE OR REPLACE FUNCTION increment_page_view()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE analytics SET total_visits = total_visits + 1 WHERE id IS NOT NULL;
END;
$$;

-- Sponsored placements (see also supabase/sponsored_slots.sql)
CREATE TABLE IF NOT EXISTS sponsored_slots (
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
  ON sponsored_slots (slot_number, expires_at);

CREATE EXTENSION IF NOT EXISTS btree_gist;

DO $$
BEGIN
  ALTER TABLE sponsored_slots
    ADD CONSTRAINT sponsored_slots_no_overlap
    EXCLUDE USING gist (
      slot_number WITH =,
      tstzrange(created_at, expires_at, '[)') WITH &&
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

ALTER TABLE sponsored_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON sponsored_slots FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION increment_sponsored_clicks(p_slot_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE sponsored_slots SET clicks = clicks + 1 WHERE id = p_slot_id;
END;
$$;

GRANT EXECUTE ON FUNCTION increment_sponsored_clicks(UUID) TO anon, authenticated;


