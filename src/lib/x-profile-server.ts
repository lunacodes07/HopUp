import { unstable_cache } from "next/cache";
import { uniqueTestimonialHandles } from "@/lib/testimonials";
import { parseXProfiles, type XProfile } from "@/lib/x-profile";
import { fetchRemoteImage, type LogoImage } from "@/lib/resolve-logo";

const LOOKUP_MS = 1500;
const REVALIDATE = 86400;

async function loadXProfiles(): Promise<Record<string, XProfile>> {
  const handles = uniqueTestimonialHandles();
  if (handles.length === 0) return {};

  const url = `https://cdn.syndication.twimg.com/widgets/followbutton/info.json?screen_names=${handles
    .map((handle) => encodeURIComponent(handle))
    .join(",")}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LOOKUP_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      next: { revalidate: REVALIDATE },
    });
    if (!res.ok) return {};
    return parseXProfiles(await res.json());
  } catch {
    return {};
  } finally {
    clearTimeout(timer);
  }
}

export const getXProfiles = unstable_cache(loadXProfiles, ["x-profiles"], {
  revalidate: REVALIDATE,
});

export async function getXDisplayNames(): Promise<Record<string, string>> {
  const profiles = await getXProfiles();
  const out: Record<string, string> = {};
  for (const [handle, profile] of Object.entries(profiles)) {
    out[handle] = profile.name;
  }
  return out;
}

export async function getXAvatarImage(handle: string): Promise<LogoImage | null> {
  const key = handle.toLowerCase();
  const profiles = await getXProfiles();
  const avatarUrl = profiles[key]?.avatarUrl;
  if (avatarUrl) {
    const image = await fetchRemoteImage(avatarUrl);
    if (image) return image;
  }

  return fetchRemoteImage(`https://unavatar.io/x/${encodeURIComponent(handle)}`);
}
