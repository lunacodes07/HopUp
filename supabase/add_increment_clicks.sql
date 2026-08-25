-- ============================================================================
-- FIX: link click counts not increasing (or losing clicks under concurrency).
--
-- The frontend previously did:  update({ clicks: item.clicks + 1 })
-- i.e. it wrote an ABSOLUTE value computed from stale browser state, so
-- multiple/concurrent clicks overwrote each other and counts barely moved.
--
-- Run this once in the Supabase SQL Editor (Dashboard -> SQL Editor).
-- Then verify in the app: every click now increments atomically.
-- ============================================================================
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

-- Grant execute to anonymous visitors (needed for the anon key)
GRANT EXECUTE ON FUNCTION public.increment_clicks(UUID) TO anon, authenticated;
