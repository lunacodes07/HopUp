export const SPONSOR_SLOT_COUNT = 3;

/**
 * Temporary house placement. Not for sale, and shown first.
 * Set to null to sell this spot again.
 */
export const HOUSE_SPONSOR: {
  slot: number;
  name: string;
  description: string;
  url: string;
  category: string;
} | null = {
  slot: 3,
  name: "Siren",
  description: "The marketing department you don't have to hire",
  url: "https://mysiren.ai/ref/ALOHA30",
  category: "Marketing",
};

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
