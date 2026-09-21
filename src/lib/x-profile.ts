export type XProfile = {
  name: string;
  avatarUrl: string;
};

type SyndicationRow = {
  screen_name?: unknown;
  name?: unknown;
  profile_image_url_https?: unknown;
};

export function upgradeTwimgAvatar(url: string): string {
  return url.replace(/_(normal|mini|bigger|200x200)(\.[a-z0-9]+)?$/i, "_400x400$2");
}

export function parseXProfiles(data: unknown): Record<string, XProfile> {
  if (!Array.isArray(data)) return {};
  const out: Record<string, XProfile> = {};
  for (const row of data as SyndicationRow[]) {
    const screen = typeof row.screen_name === "string" ? row.screen_name.trim() : "";
    const name = typeof row.name === "string" ? row.name.trim() : "";
    const avatar = typeof row.profile_image_url_https === "string" ? row.profile_image_url_https.trim() : "";
    if (!screen || !name) continue;
    out[screen.toLowerCase()] = {
      name,
      avatarUrl: avatar ? upgradeTwimgAvatar(avatar) : "",
    };
  }
  return out;
}

export function parseXDisplayNames(data: unknown): Record<string, string> {
  const profiles = parseXProfiles(data);
  const out: Record<string, string> = {};
  for (const [handle, profile] of Object.entries(profiles)) {
    out[handle] = profile.name;
  }
  return out;
}
