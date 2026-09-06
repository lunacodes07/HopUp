-- Creator referrals. Add people by hand. Run this in the Supabase SQL editor.
-- Operator guide: supabase/CREATORS.md

CREATE TABLE IF NOT EXISTS public.creators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  stats_key TEXT NOT NULL UNIQUE,
  clicks INTEGER DEFAULT 0 NOT NULL,
  paid_cents INTEGER DEFAULT 0 NOT NULL
);

CREATE TABLE IF NOT EXISTS public.referral_sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  creator_id UUID NOT NULL REFERENCES public.creators (id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('hop', 'sponsored')),
  amount_cents INTEGER NOT NULL,
  commission_cents INTEGER NOT NULL,
  url TEXT,
  payment_id TEXT UNIQUE
);

CREATE INDEX IF NOT EXISTS referral_sales_creator_idx
  ON public.referral_sales (creator_id, created_at DESC);

ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_sales ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.increment_creator_clicks(p_slug TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.creators SET clicks = clicks + 1 WHERE slug = p_slug;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_creator_clicks(TEXT) TO service_role;

-- Example. Change the name/slug, then send them:
--   share:  https://www.hopup.lol/c/aloha
--   stats:  https://www.hopup.lol/c/aloha/stats?k=<stats_key>
-- After you pay them: UPDATE creators SET paid_cents = paid_cents + 2500 WHERE slug = 'aloha';
INSERT INTO public.creators (slug, name, stats_key)
VALUES ('aloha', 'Aloha', encode(gen_random_bytes(16), 'hex'))
ON CONFLICT (slug) DO NOTHING;
