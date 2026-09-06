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

export async function isStanleySlotAvailable(slotNumber: number): Promise<boolean> {
  if (!isValidStanleySlot(slotNumber)) return false;
  const { data, error } = await supabaseServer
    .from("stanley_slots")
    .select("id")
    .eq("slot_number", slotNumber)
    .limit(1);

  if (error) throw error;
  return !data || data.length === 0;
}
