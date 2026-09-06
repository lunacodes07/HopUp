-- Core hop tables. Run once on a new project.
-- Sponsored + creators are separate files — see supabase/README.md.

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

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON products FOR SELECT USING (true);

CREATE TABLE analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  total_visits INTEGER DEFAULT 0 NOT NULL
);

INSERT INTO analytics (total_visits) VALUES (0);

ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON analytics FOR SELECT USING (true);

-- Atomic product click counter. Called from /api/click (service role).
CREATE OR REPLACE FUNCTION public.increment_clicks(p_product_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE products SET clicks = clicks + 1 WHERE id = p_product_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_clicks(UUID) TO service_role;

-- Hero visit counter. Called from the browser.
CREATE OR REPLACE FUNCTION public.increment_page_view()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE analytics SET total_visits = total_visits + 1 WHERE id IS NOT NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_page_view() TO anon, authenticated;
