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

-- Durable one-vote-per-visitor keys. App also stores these in Redis so
-- incognito / cleared cookies cannot vote the same listing twice.
CREATE TABLE IF NOT EXISTS public.product_votes (
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  voter_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (product_id, voter_hash)
);

ALTER TABLE public.product_votes ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.claim_upvote(p_product_id UUID, p_voter_hash TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_claimed BOOLEAN := FALSE;
BEGIN
  IF p_voter_hash IS NULL OR length(p_voter_hash) < 16 OR length(p_voter_hash) > 128 THEN
    RETURN 0;
  END IF;

  INSERT INTO product_votes (product_id, voter_hash)
  VALUES (p_product_id, p_voter_hash)
  ON CONFLICT DO NOTHING
  RETURNING TRUE INTO v_claimed;

  IF v_claimed IS NOT TRUE THEN
    RETURN 0;
  END IF;

  UPDATE products
  SET upvotes = COALESCE(upvotes, 0) + 1
  WHERE id = p_product_id
  RETURNING upvotes INTO v_count;

  RETURN COALESCE(v_count, 1);
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_upvote(UUID, TEXT) TO service_role;
