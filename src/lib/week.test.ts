import assert from "node:assert/strict";
import { test } from "node:test";
import {
  allTimeList,
  claimWeekPrice,
  findHof,
  thisWeekList,
  topWeekBid,
  weekBid,
  WEEK_MS,
} from "./week.ts";

const now = Date.parse("2026-09-23T12:00:00Z");
const recent = new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString();
const stale = new Date(now - 8 * 24 * 60 * 60 * 1000).toISOString();

test("this week shows only the latest payment, all time keeps the lifetime total", () => {
  const products = [
    { id: "plaque", price: 70, week_bid: 0, is_hof: true, last_hopped_at: recent, created_at: stale },
    { id: "old", price: 66, week_bid: 11, last_hopped_at: recent, created_at: stale, category: "Design" },
    { id: "bigger", price: 40, week_bid: 40, last_hopped_at: recent, created_at: recent, category: "Design" },
    { id: "quiet", price: 20, week_bid: 2, last_hopped_at: stale, created_at: stale, category: "SEO" },
  ];

  assert.equal(weekBid(products[1], now), 11);
  assert.deepEqual(
    thisWeekList(products, now).map((p) => p.id),
    ["bigger", "old"]
  );
  assert.deepEqual(
    allTimeList(products).map((p) => [p.id, p.price]),
    [
      ["old", 66],
      ["bigger", 40],
      ["quiet", 20],
    ]
  );
});

test("an earlier equal bid stays ahead, so passing it costs one dollar more", () => {
  const earlier = new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString();
  const later = new Date(now - 60 * 60 * 1000).toISOString();
  const products = [
    { id: "plaque", price: 80, week_bid: 0, is_hof: true, last_hopped_at: stale, created_at: stale },
    { id: "later", price: 10, week_bid: 10, last_hopped_at: later, created_at: later },
    { id: "earlier", price: 10, week_bid: 10, last_hopped_at: earlier, created_at: earlier },
  ];
  assert.equal(thisWeekList(products, now)[0].id, "earlier");
  assert.equal(claimWeekPrice(10, 2), 11);
  assert.equal(claimWeekPrice(0, 2), 2);
});

test("listings with no week bid yet use the lifetime price once, inside 7 days", () => {
  const hopped = { id: "fresh", price: 55, last_hopped_at: recent, created_at: stale };
  const expired = { id: "gone", price: 55, last_hopped_at: stale, created_at: stale };
  assert.equal(weekBid(hopped, now), 55);
  assert.equal(weekBid(expired, now), 0);
  assert.equal(now - Date.parse(stale) > WEEK_MS, true);
});

test("hall of fame stays pinned and does not set this week's price", () => {
  const products = [
    { id: "plaque", price: 65, week_bid: 0, is_hof: true, last_hopped_at: recent, created_at: stale, category: "Design" },
    { id: "week", price: 66, week_bid: 11, last_hopped_at: recent, created_at: recent, category: "Design" },
    { id: "seo", price: 4, week_bid: 2, last_hopped_at: recent, created_at: recent, category: "SEO" },
  ];
  assert.equal(findHof(products)?.id, "plaque");
  assert.deepEqual(
    thisWeekList(products, now).map((p) => p.id),
    ["week", "seo"]
  );
  assert.equal(allTimeList(products)[0].id, "week");
  assert.equal(topWeekBid(products, now), 11);
  assert.equal(topWeekBid(products, now, "SEO"), 2);
  assert.equal(claimWeekPrice(topWeekBid(products, now, "Design"), 2), 12);
});

test("before the pin exists, the highest lifetime price is hall of fame", () => {
  const products = [
    { id: "top", price: 55, last_hopped_at: recent, created_at: stale },
    { id: "next", price: 20, last_hopped_at: recent, created_at: recent },
  ];
  assert.equal(findHof(products)?.id, "top");
  assert.equal(thisWeekList(products, now)[0].id, "next");
});
