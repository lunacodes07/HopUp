export const SPONSOR_SLOT_COUNT = 4;

export const SPONSOR_PLANS = [
  { weeks: 1, price: 30, label: "1 week", hint: "Standard" },
  { weeks: 2, price: 50, label: "2 weeks", hint: "Save $10" },
  { weeks: 4, price: 90, label: "4 weeks", hint: "Save $30" },
] as const;

export type SponsorPlan = (typeof SPONSOR_PLANS)[number];

export function getSponsorPlan(weeks: unknown): SponsorPlan | null {
  const n = typeof weeks === "number" ? weeks : parseInt(String(weeks), 10);
  return SPONSOR_PLANS.find((p) => p.weeks === n) ?? null;
}

export function isValidSlotNumber(slot: unknown): slot is number {
  const n = typeof slot === "number" ? slot : parseInt(String(slot), 10);
  return Number.isInteger(n) && n >= 1 && n <= SPONSOR_SLOT_COUNT;
}
