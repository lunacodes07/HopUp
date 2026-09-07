import { supabaseServer } from "@/lib/supabase-server";
import { isValidStanleySlot, type StanleySlot } from "@/lib/stanley-slots";

export async function getStanleySlots(): Promise<StanleySlot[]> {
  const { data, error } = await supabaseServer
    .from("stanley_slots")
    .select("id, slot_number, name, url, price, created_at")
    .order("slot_number", { ascending: true });

  if (error) return [];
  return (data ?? []) as StanleySlot[];
}

export async function getStanleySlot(slotNumber: number): Promise<StanleySlot | null> {
  if (!isValidStanleySlot(slotNumber)) return null;
  const { data, error } = await supabaseServer
    .from("stanley_slots")
    .select("id, slot_number, name, url, price, created_at")
    .eq("slot_number", slotNumber)
    .limit(1);

  if (error) throw error;
  return (data?.[0] as StanleySlot) ?? null;
}

export async function isStanleySlotAvailable(slotNumber: number): Promise<boolean> {
  const row = await getStanleySlot(slotNumber);
  return !row;
}
