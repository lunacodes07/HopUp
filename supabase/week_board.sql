-- This week board.
-- Run once in the Supabase SQL Editor after the other product migrations.
-- `price` stays the lifetime total. `week_bid` is only the latest payment.
-- `is_hof` pins Hall of Fame until someone pays $10 more. Time does not clear it.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS week_bid INTEGER,
  ADD COLUMN IF NOT EXISTS is_hof BOOLEAN NOT NULL DEFAULT FALSE;

-- New rows start false. This only flips the current highest bid on.
WITH winner AS (
  SELECT id
  FROM public.products
  ORDER BY price DESC, created_at ASC
  LIMIT 1
)
UPDATE public.products AS product
SET is_hof = (product.id = winner.id)
FROM winner
WHERE product.is_hof IS DISTINCT FROM (product.id = winner.id);

-- Leave week_bid null on existing rows. A hop inside the last 7 days
-- shows once at the current lifetime price. The next payment stores
-- only that new amount here and adds it to price.
