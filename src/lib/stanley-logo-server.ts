import { createHash } from "crypto";
import { supabaseServer } from "@/lib/supabase-server";

const BUCKET = "stanley-logos";
const MAX_BYTES = 1_200_000;
const FILE_NAME = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpg|jpeg|webp)$/i;
const INTENT_NAME = /^\d{1,2}-[0-9a-f]{16,40}\.(png|jpg|jpeg|webp)$/i;

function parseDataImage(raw: string): { bytes: Buffer; contentType: string; ext: string } | null {
  const match = raw
    .trim()
    .match(/^data:image\/(png|jpeg|jpg|webp);base64,([A-Za-z0-9+/=\s]+)$/i);
  if (!match) return null;
  const kind = match[1].toLowerCase();
  const ext = kind === "jpeg" || kind === "jpg" ? "jpg" : kind;
  const contentType = ext === "jpg" ? "image/jpeg" : ext === "webp" ? "image/webp" : "image/png";
  const bytes = Buffer.from(match[2].replace(/\s/g, ""), "base64");
  if (bytes.length < 32 || bytes.length > MAX_BYTES) return null;
  return { bytes, contentType, ext };
}

export function stanleyLogoIntentPath(
  slotNumber: number,
  url: string,
  price: number,
  ext = "png"
): string {
  const digest = createHash("sha256")
    .update(`${slotNumber}\n${url}\n${price}`)
    .digest("hex")
    .slice(0, 20);
  return `${slotNumber}-${digest}.${ext}`;
}

export function publicUrlForStanleyLogo(path: string): string {
  const { data } = supabaseServer.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export function isStoredStanleyLogoUrl(href: string): boolean {
  try {
    const parsed = new URL(href);
    return parsed.protocol === "https:" && parsed.pathname.includes(`/${BUCKET}/`);
  } catch {
    return false;
  }
}

function decodeLogoRef(raw: string): string {
  const trimmed = raw.trim();
  try {
    return decodeURIComponent(trimmed);
  } catch {
    return trimmed;
  }
}

export function normalizeStanleyLogoRef(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  const value = decodeLogoRef(raw);
  if (FILE_NAME.test(value) || INTENT_NAME.test(value)) {
    return publicUrlForStanleyLogo(value);
  }
  if (isStoredStanleyLogoUrl(value)) return value;
  return null;
}

async function stanleyLogoExists(path: string): Promise<boolean> {
  const publicUrl = publicUrlForStanleyLogo(path);
  try {
    const response = await fetch(publicUrl, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
}

export async function resolvePaymentStanleyLogo(opts: {
  slotNumber: number;
  url: string;
  price: number;
  rawLogo?: unknown;
}): Promise<string | null> {
  const fromMeta = normalizeStanleyLogoRef(opts.rawLogo);
  if (fromMeta) return fromMeta;

  for (const ext of ["png", "jpg", "webp"] as const) {
    const path = stanleyLogoIntentPath(opts.slotNumber, opts.url, opts.price, ext);
    if (await stanleyLogoExists(path)) return publicUrlForStanleyLogo(path);
  }
  return null;
}

async function uploadStanleyLogo(image: {
  bytes: Buffer;
  contentType: string;
  ext: string;
}, intent?: { slotNumber: number; url: string; price: number }): Promise<string> {
  const path = intent
    ? stanleyLogoIntentPath(intent.slotNumber, intent.url, intent.price, image.ext)
    : `${crypto.randomUUID()}.${image.ext}`;

  const { error } = await supabaseServer.storage.from(BUCKET).upload(path, image.bytes, {
    contentType: image.contentType,
    upsert: Boolean(intent),
  });
  if (error) {
    console.error("Stanley logo upload failed:", error);
    throw new Error("Could not save your logo. Try again.");
  }

  return path;
}

export async function storeStanleyLogo(
  dataUrl: string,
  intent?: { slotNumber: number; url: string; price: number }
): Promise<string> {
  const image = parseDataImage(dataUrl);
  if (!image) throw new Error("Logo must be a PNG or JPG under 1MB.");
  return uploadStanleyLogo(image, intent);
}

export async function storeStanleyLogoFromUrl(
  href: string,
  intent?: { slotNumber: number; url: string; price: number }
): Promise<string> {
  const parsed = new URL(href);
  if (parsed.protocol !== "https:") throw new Error("Logo URL must be https.");

  const response = await fetch(href);
  if (!response.ok) throw new Error("Could not download that logo.");

  const contentType = (response.headers.get("content-type") || "").toLowerCase();
  const ext = contentType.includes("jpeg") || contentType.includes("jpg")
    ? "jpg"
    : contentType.includes("webp")
      ? "webp"
      : "png";
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 32 || bytes.length > MAX_BYTES) {
    throw new Error("Logo must be a PNG or JPG under 1MB.");
  }

  return uploadStanleyLogo(
    {
      bytes,
      contentType: ext === "jpg" ? "image/jpeg" : ext === "webp" ? "image/webp" : "image/png",
      ext,
    },
    intent
  );
}
