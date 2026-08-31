import { supabaseServer } from "@/lib/supabase-server";
import { SPONSOR_SLOT_COUNT } from "@/lib/sponsored";

export async function getOccupiedSlotNumbers(): Promise<number[]> {
  const { data, error } = await supabaseServer
    .from("sponsored_slots")
    .select("slot_number")
    .gt("expires_at", new Date().toISOString());

  if (error) throw error;
  return (data ?? []).map((row) => row.slot_number);
}

export async function isSlotAvailable(slotNumber: number): Promise<boolean> {
  const occupied = await getOccupiedSlotNumbers();
  return !occupied.includes(slotNumber);
}

/** Returns a free slot, preferring `requested`. Never reuses an occupied slot. */
export async function resolveSponsoredSlot(requested: number): Promise<number | null> {
  const occupied = new Set(await getOccupiedSlotNumbers());
  if (!occupied.has(requested)) return requested;
  for (let n = 1; n <= SPONSOR_SLOT_COUNT; n++) {
    if (!occupied.has(n)) return n;
  }
  return null;
}
