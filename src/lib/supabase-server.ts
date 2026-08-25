import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy.supabase.co";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "dummy";

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn("⚠️ Missing SUPABASE_SERVICE_ROLE_KEY environment variable. Secure backend operations will fail.");
}

// Initialize the Supabase client with the Service Role key.
// IMPORTANT: This client bypasses Row Level Security (RLS) entirely.
// NEVER import this client in a client-side component (e.g. anything with 'use client').
// Only use this in API routes or Server Actions.
export const supabaseServer = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
