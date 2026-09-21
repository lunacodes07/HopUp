export function isOurSupabaseStorageUrl(href: string, bucket: string): boolean {
  try {
    const parsed = new URL(href);
    if (parsed.protocol !== "https:") return false;
    const rawBase = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!rawBase || !bucket) return false;
    const allowed = new URL(rawBase);
    if (parsed.hostname !== allowed.hostname) return false;
    const path = parsed.pathname.toLowerCase();
    const name = bucket.toLowerCase();
    return path.includes(`/object/public/${name}/`) || path.includes(`/${name}/`);
  } catch {
    return false;
  }
}
