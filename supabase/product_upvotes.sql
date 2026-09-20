-- Per-listing upvote counts. Run once in the Supabase SQL Editor.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS upvotes INTEGER DEFAULT 0 NOT NULL;

CREATE OR REPLACE FUNCTION public.increment_upvotes(p_product_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE products
  SET upvotes = COALESCE(upvotes, 0) + 1
  WHERE id = p_product_id
  RETURNING upvotes INTO v_count;

  RETURN COALESCE(v_count, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_upvotes(UUID) TO service_role;
