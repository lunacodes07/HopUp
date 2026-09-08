import { STANLEY_SLOT_COUNT, nextSlotPrice, slotHopAmount, slotPrice } from "@/lib/brand-objects";
import { getProxiedLogoUrl } from "@/lib/logo";

export type StanleySlot = {
  id: string;
  slot_number: number;
  name: string;
  url: string;
  price: number;
  logo_url?: string | null;
  created_at?: string;
};

function isStanleyStoredLogo(href?: string | null): boolean {
  if (!href) return false;
  try {
    const parsed = new URL(href);
    return parsed.protocol === "https:" && parsed.pathname.includes("/stanley-logos/");
  } catch {
    return false;
  }
}

export function stanleyDisplayLogo(row: Pick<StanleySlot, "url" | "logo_url">): string {
  if (row.logo_url && isStanleyStoredLogo(row.logo_url)) {
    return `/api/stanley-logo?u=${encodeURIComponent(row.logo_url)}`;
  }
  return getProxiedLogoUrl(row.url);
}

export function isValidStanleySlot(slot: unknown): slot is number {
  const n = typeof slot === "number" ? slot : parseInt(String(slot), 10);
  return Number.isInteger(n) && n >= 1 && n <= STANLEY_SLOT_COUNT;
}

export function stanleySlotPrice(slotNumber: number): number {
  return slotPrice(slotNumber);
}

export function stanleyHopAmount(slotNumber: number): number {
  return slotHopAmount(slotNumber);
}

export function stanleyNextSlotPrice(slotNumber: number, currentPrice?: number | null): number {
  return nextSlotPrice(slotNumber, currentPrice);
}
