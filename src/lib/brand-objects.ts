export type BrandObjectStatus = "live" | "soon" | "blurred";

export type BrandObject = {
  slug: string;
  name: string;
  item: string;
  tagline: string;
  status: BrandObjectStatus;
  slots: number;
  price: number;
  /** Accent tint for the card artwork */
  tint: string;
};

export const SLOT_PRICE = 35; // large slots (upper ring)
export const SMALL_SLOT_PRICE = 20; // small slots (base ring)
export const LARGE_HOP_AMOUNT = 15;
export const SMALL_HOP_AMOUNT = 10;
export const LARGE_SLOT_COUNT = 6;
export const STANLEY_SLOT_COUNT = 12;

/** Slots 1-6 are the large upper ring, 7+ are the small base ring. */
export function slotPrice(slotNumber: number): number {
  return slotNumber <= LARGE_SLOT_COUNT ? SLOT_PRICE : SMALL_SLOT_PRICE;
}

/** Extra dollars to hop over whoever is already on this spot. */
export function slotHopAmount(slotNumber: number): number {
  return slotNumber <= LARGE_SLOT_COUNT ? LARGE_HOP_AMOUNT : SMALL_HOP_AMOUNT;
}

/** Opening list price, or current bid + hop increment. */
export function nextSlotPrice(slotNumber: number, currentPrice?: number | null): number {
  if (typeof currentPrice !== "number" || currentPrice <= 0) return slotPrice(slotNumber);
  return currentPrice + slotHopAmount(slotNumber);
}

/** Max this Stanley can take if every spot is claimed. */
export function stanleyCapacity(slotCount = STANLEY_SLOT_COUNT): number {
  let total = 0;
  for (let n = 1; n <= slotCount; n++) total += slotPrice(n);
  return total;
}

export function stanleyRaised(filledSlots: Iterable<number>): number {
  let total = 0;
  for (const n of filledSlots) total += slotPrice(n);
  return total;
}

/* ------------------------------------------------------------------ */
/* Brand My Backpack — 14 spots across 6 zones                         */
/* ------------------------------------------------------------------ */

export const BACKPACK_SLOT_COUNT = 14;

export type BackpackZone = {
  label: string;
  hint: string;
  slots: number[];
  price: number;
};

export const BACKPACK_ZONES: BackpackZone[] = [
  { label: "Front", hint: "1 hero spot", slots: [1], price: 100 },
  { label: "Front pocket", hint: "side by side, below the zip", slots: [2, 3], price: 75 },
  { label: "Left side", hint: "stacked", slots: [4, 5, 6], price: 40 },
  { label: "Right side", hint: "stacked", slots: [7, 8, 9], price: 40 },
  { label: "Top", hint: "full area around the handle", slots: [10], price: 50 },
  { label: "Inside panel", hint: "hidden when I wear it", slots: [11, 12, 13, 14], price: 30 },
];

export function backpackSlotPrice(slotNumber: number): number {
  if (slotNumber === 1) return 100;
  if (slotNumber <= 3) return 75;
  if (slotNumber <= 9) return 40;
  if (slotNumber === 10) return 50;
  return 30;
}

/** $660 if every spot on the bag is claimed. */
export function backpackCapacity(): number {
  let total = 0;
  for (let n = 1; n <= BACKPACK_SLOT_COUNT; n++) total += backpackSlotPrice(n);
  return total;
}

/**
 * Registry for every Brand My Stuff experience.
 * To launch a new object: add an entry here with status "live"
 * and create src/app/<slug>/page.tsx rendering its experience.
 */
export const BRAND_OBJECTS: BrandObject[] = [
  {
    slug: "brandmystanley",
    name: "Brand My Stanley",
    item: "Tumbler",
    tagline: "Aloha's daily cup — on the street and on this page.",
    status: "live",
    slots: STANLEY_SLOT_COUNT,
    price: SMALL_SLOT_PRICE,
    tint: "#F2AFC9",
  },
  {
    slug: "brandmybackpack",
    name: "Brand My Backpack",
    item: "Backpack",
    tagline: "Patch your brand on the daily carry.",
    status: "soon",
    slots: BACKPACK_SLOT_COUNT,
    price: 30,
    tint: "#9EB8D4",
  },
  {
    slug: "brandmylaptop",
    name: "Brand My Laptop",
    item: "Laptop",
    tagline: "Sticker real estate, but make it official.",
    status: "blurred",
    slots: 10,
    price: SLOT_PRICE,
    tint: "#9AB0C4",
  },
  {
    slug: "brandmyphone",
    name: "Brand My Phone",
    item: "Phone",
    tagline: "The case everyone at the meetup sees.",
    status: "blurred",
    slots: 4,
    price: SLOT_PRICE,
    tint: "#C4A98F",
  },
];

export function getBrandObject(slug: string): BrandObject | undefined {
  return BRAND_OBJECTS.find((o) => o.slug === slug);
}
