# Creator referrals

You add people by hand in the Supabase SQL editor. There is no signup and no login.

Deal: **25%** of hops and sponsored checkouts that came through their link. **30-day cookie**, last click wins. Pay monthly over **$25** (PayPal / Wise / UPI — whatever you already use).

First-time setup: run `creators.sql` once.

---

## Add a creator

```sql
INSERT INTO creators (slug, name, stats_key)
VALUES ('maya', 'Maya', encode(gen_random_bytes(16), 'hex'));
```

- `slug` is the link: lowercase letters, numbers, hyphens. Do not use `hopup`, `stats`, `admin`, or `c`.
- `name` is what visitors see (“Maya sent you”).
- `stats_key` is generated. Do not invent one.

Then pull the two URLs:

```sql
SELECT
  slug,
  name,
  'https://www.hopup.lol/c/' || slug AS share_url,
  'https://www.hopup.lol/c/' || slug || '/stats?k=' || stats_key AS stats_url
FROM creators
WHERE slug = 'maya';
```

Send them **both**:

| Link | Who sees it |
|---|---|
| `https://www.hopup.lol/c/maya` | Public. They post this. |
| `https://www.hopup.lol/c/maya/stats?k=…` | Private. Only them. |

Locally, swap the host for `http://localhost:3003`.

---

## Check sales (you)

Everyone at once:

```sql
SELECT
  c.slug,
  c.name,
  c.clicks,
  COUNT(s.id) AS sales,
  COALESCE(SUM(s.amount_cents), 0) / 100.0 AS sale_dollars,
  COALESCE(SUM(s.commission_cents), 0) / 100.0 AS earned,
  c.paid_cents / 100.0 AS paid,
  (COALESCE(SUM(s.commission_cents), 0) - c.paid_cents) / 100.0 AS unpaid
FROM creators c
LEFT JOIN referral_sales s ON s.creator_id = c.id
GROUP BY c.id
ORDER BY unpaid DESC;
```

One person, recent hops:

```sql
SELECT
  s.created_at,
  s.kind,
  s.amount_cents / 100.0 AS sale,
  s.commission_cents / 100.0 AS earned,
  s.url
FROM referral_sales s
JOIN creators c ON c.id = s.creator_id
WHERE c.slug = 'maya'
ORDER BY s.created_at DESC;
```

Who is over $25 and ready to pay:

```sql
SELECT c.slug, c.name,
  (COALESCE(SUM(s.commission_cents), 0) - c.paid_cents) / 100.0 AS unpaid
FROM creators c
LEFT JOIN referral_sales s ON s.creator_id = c.id
GROUP BY c.id
HAVING (COALESCE(SUM(s.commission_cents), 0) - c.paid_cents) >= 2500
ORDER BY unpaid DESC;
```

## Check sales (them)

They open their stats URL. It shows clicks, sales, earned, unpaid, and recent hops.

Wrong or missing `k` shows “Private stats”.

If they lose the link, run the `stats_url` select again and resend it. Do not put `stats_key` in a tweet.

---

## Pay them

1. Send the unpaid amount however you agreed (PayPal / Wise / UPI).
2. Mark it paid so unpaid goes back to $0. Amounts are **cents**.

$25 payout:

```sql
UPDATE creators
SET paid_cents = paid_cents + 2500
WHERE slug = 'maya';
```

Or set paid equal to everything they have earned so far:

```sql
UPDATE creators c
SET paid_cents = (
  SELECT COALESCE(SUM(commission_cents), 0)
  FROM referral_sales
  WHERE creator_id = c.id
)
WHERE slug = 'maya';
```

Their dashboard unpaid figure drops after that. There is no auto-payout.

---

## Notes

- A sale only records after a **production** Dodo webhook. Local checkouts do not write hops or referral sales.
- Clicks increment when someone opens `/c/slug` (about once per browser per 12 hours).
- `?ref=maya` on the homepage also attributes the cookie, but the share link should stay `/c/maya`.
- To rename the public label: `UPDATE creators SET name = 'Maya K' WHERE slug = 'maya';`
- Slug changes break their old link. Add a new row instead.
