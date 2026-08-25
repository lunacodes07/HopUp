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
  url TEXT
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


