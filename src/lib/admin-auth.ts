export const ADMIN_COOKIE = "hopup_admin";
const SESSION_MARK = "hopup-admin-session";

export function adminSecret(): string | null {
  const value = process.env.HOPUP_ADMIN_SECRET?.trim();
  return value ? value : null;
}

/** Production always requires a secret. Local can stay unlocked if none is set. */
export function adminMustAuthenticate(): boolean {
  return Boolean(adminSecret()) || process.env.NODE_ENV === "production";
}

export function secretsMatch(given: string, expected: string): boolean {
  const max = Math.max(given.length, expected.length, 1);
  let out = 0;
  for (let i = 0; i < max; i++) {
    out |= (given.charCodeAt(i) || 0) ^ (expected.charCodeAt(i) || 0);
  }
  return given.length === expected.length && out === 0;
}

function bytesToHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function adminSessionToken(secret: string): Promise<string> {
  const data = new TextEncoder().encode(`${SESSION_MARK}:${secret}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return bytesToHex(hash);
}

export async function isAdminToken(value: string | undefined | null): Promise<boolean> {
  const secret = adminSecret();
  if (!secret || !value) return false;
  const expected = await adminSessionToken(secret);
  return secretsMatch(value, expected);
}

export async function isAdminRequest(request: Request): Promise<boolean> {
  const header = request.headers.get("x-admin-secret") || "";
  const secret = adminSecret();
  if (secret && header && secretsMatch(header, secret)) return true;

  const cookie = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${ADMIN_COOKIE}=`));
  const token = cookie ? decodeURIComponent(cookie.slice(ADMIN_COOKIE.length + 1)) : "";
  return isAdminToken(token);
}
