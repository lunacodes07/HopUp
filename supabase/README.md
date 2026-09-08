# Supabase

Five tables. All of them are live. Nothing leftover to drop.

| Table | What it is | Who writes |
|---|---|---|
| `products` | Hop leaderboard. Rank is **not** stored here — the app sorts by `price` desc. | Production webhook (`applyHopPayment`) |
| `analytics` | One-row visit counter for the hero “total visits” number. | Browser RPC `increment_page_view` |
| `sponsored_slots` | Four paid spots above the board. Separate from hops. | Production webhook (`applySponsoredPayment`) |
| `creators` | Referral partners. Added by hand. | You, plus `increment_creator_clicks` |
| `referral_sales` | One row per attributed hop/sponsored/Stanley checkout. | Production webhook (`recordReferralSale`) |
| `stanley_slots` | Twelve spots on Brand My Stanley. One row per slot; hops replace the occupant and raise the bid. | Production webhook (`applyStanleyPayment`) |

RPCs (not tables): `increment_clicks`, `increment_page_view`, `increment_sponsored_clicks`, `increment_creator_clicks`.

## SQL files (run once, in this order)

1. `schema.sql` — `products`, `analytics`, click + visit RPCs
2. `sponsored_slots.sql` — sponsored table + realtime
3. `creators.sql` — creators + referral_sales (see `CREATORS.md`)
4. `stanley_slots.sql` — Stanley cup spots + referral kind `stanley`
5. `stanley_slots_logo.sql` — optional uploaded logo on a Stanley spot + public `stanley-logos` bucket

Do not paste `schema.sql` into a database that already has these tables. It is the original create script, not a migration.

## Not tables / not unused

- `products.rank` is a leftover **column**. Inserts still write `0` because the column is `NOT NULL`. Display rank is computed in JS. Safe to ignore; do not drop it unless you also change the insert.
- Vercel Analytics (`@vercel/analytics`) is a JS snippet, not a Supabase table.
- There is no `traffic_events` table in this repo.
