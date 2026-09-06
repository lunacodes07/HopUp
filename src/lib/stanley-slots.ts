import { STANLEY_SLOT_COUNT, slotPrice } from "@/lib/brand-objects";

export type StanleySlot = {
  id: string;
  slot_number: number;
  name: string;
  url: string;
  price: number;
  created_at?: string;
};

export function isValidStanleySlot(slot: unknown): slot is number {
  const n = typeof slot === "number" ? slot : parseInt(String(slot), 10);
  return Number.isInteger(n) && n >= 1 && n <= STANLEY_SLOT_COUNT;
}

export function stanleySlotPrice(slotNumber: number): number {
  return slotPrice(slotNumber);
}
