import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.warn("⚠️ Missing NEXT_PUBLIC_SUPABASE_URL environment variable.");
}

// Initialize the Supabase client.
// We use a singleton instance for the client-side to prevent recreating the client.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
