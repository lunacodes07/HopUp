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

export const SLOT_PRICE = 30; // large slots (upper ring)
export const SMALL_SLOT_PRICE = 15; // small slots (base ring)
export const LARGE_SLOT_COUNT = 6;
export const STANLEY_SLOT_COUNT = 12;

/** Slots 1-6 are the large upper ring, 7+ are the small base ring. */
export function slotPrice(slotNumber: number): number {
  return slotNumber <= LARGE_SLOT_COUNT ? SLOT_PRICE : SMALL_SLOT_PRICE;
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
    tagline: "Your logo on the cup that goes everywhere.",
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
    slots: 6,
    price: SLOT_PRICE,
    tint: "#8FA98F",
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
