import { supabaseServer } from "@/lib/supabase-server";

const BUCKET = "product-logos";
const MAX_BYTES = 1_200_000;
const PRODUCT_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EXTS = ["png", "jpg", "webp"] as const;

type StoredImage = {
  bytes: Buffer;
  contentType: string;
  ext: (typeof EXTS)[number];
};

function parseDataImage(raw: string): StoredImage | null {
  const match = raw
    .trim()
    .match(/^data:image\/(png|jpeg|jpg|webp);base64,([A-Za-z0-9+/=\s]+)$/i);
  if (!match) return null;
  const kind = match[1].toLowerCase();
  const ext = kind === "jpeg" || kind === "jpg" ? "jpg" : kind === "webp" ? "webp" : "png";
  const contentType = ext === "jpg" ? "image/jpeg" : ext === "webp" ? "image/webp" : "image/png";
  const bytes = Buffer.from(match[2].replace(/\s/g, ""), "base64");
  if (bytes.length < 32 || bytes.length > MAX_BYTES) return null;
  return { bytes, contentType, ext };
}

export function isProductId(value: string): boolean {
  return PRODUCT_ID.test(value);
}

async function ensureBucket() {
  const { data } = await supabaseServer.storage.getBucket(BUCKET);
  if (data) return;

  const { error } = await supabaseServer.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: MAX_BYTES,
    allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
  });
  if (error && !/already exists/i.test(error.message)) {
    console.error("Product logo bucket create failed:", error);
    throw new Error("Could not save that logo. Try again.");
  }
}

function objectPath(productId: string, ext: string) {
  return `${productId}.${ext}`;
}

export function publicUrlForProductLogo(path: string): string {
  const { data } = supabaseServer.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export function isStoredProductLogoUrl(href: string): boolean {
  try {
    const parsed = new URL(href);
    return parsed.protocol === "https:" && parsed.pathname.includes(`/${BUCKET}/`);
  } catch {
    return false;
  }
}

async function saveProductLogoUrl(productId: string, publicUrl: string) {
  const { error } = await supabaseServer
    .from("products")
    .update({ logo_url: publicUrl })
    .eq("id", productId);
  if (error) {
    console.error("Product logo_url update failed:", error);
    throw new Error(
      "Logo file saved, but products.logo_url is missing. Run supabase/products_logo.sql in the Supabase SQL editor, then upload again."
    );
  }
}

async function removeOtherExts(productId: string, keepExt: string) {
  const extras = EXTS.filter((ext) => ext !== keepExt).map((ext) => objectPath(productId, ext));
  if (extras.length === 0) return;
  await supabaseServer.storage.from(BUCKET).remove(extras);
}

async function uploadProductLogo(productId: string, image: StoredImage): Promise<string> {
  if (!isProductId(productId)) throw new Error("Invalid product.");
  await ensureBucket();

  const path = objectPath(productId, image.ext);
  const { error } = await supabaseServer.storage.from(BUCKET).upload(path, image.bytes, {
    contentType: image.contentType,
    upsert: true,
  });
  if (error) {
    console.error("Product logo upload failed:", error);
    throw new Error("Could not save that logo. Try again.");
  }

  await removeOtherExts(productId, image.ext);
  const publicUrl = publicUrlForProductLogo(path);
  await saveProductLogoUrl(productId, publicUrl);
  return publicUrl;
}

export async function storeProductLogo(productId: string, dataUrl: string): Promise<string> {
  const image = parseDataImage(dataUrl);
  if (!image) throw new Error("Logo must be a PNG, JPG, or WebP under 1MB.");
  return uploadProductLogo(productId, image);
}

export async function storePendingProductLogo(dataUrl: string): Promise<string> {
  const image = parseDataImage(dataUrl);
  if (!image) throw new Error("Logo must be a PNG, JPG, or WebP under 1MB.");
  await ensureBucket();

  const path = `pending/${crypto.randomUUID()}.${image.ext}`;
  const { error } = await supabaseServer.storage.from(BUCKET).upload(path, image.bytes, {
    contentType: image.contentType,
    upsert: false,
  });
  if (error) {
    console.error("Pending product logo upload failed:", error);
    throw new Error("Could not save that logo. Try again.");
  }
  return path;
}

export function isPendingProductLogo(path: unknown): path is string {
  return typeof path === "string" && /^pending\/[0-9a-f-]{36}\.(png|jpg|webp)$/i.test(path);
}

export async function applyPendingProductLogo(productId: string, pendingPath: string): Promise<void> {
  if (!isProductId(productId) || !isPendingProductLogo(pendingPath)) return;

  const { data, error } = await supabaseServer.storage.from(BUCKET).download(pendingPath);
  if (error || !data) {
    console.error("Pending product logo download failed:", error);
    return;
  }

  const ext = pendingPath.split(".").pop()?.toLowerCase();
  const imageExt = ext === "jpg" || ext === "webp" ? ext : "png";
  const bytes = Buffer.from(await data.arrayBuffer());
  if (bytes.length < 32 || bytes.length > MAX_BYTES) return;

  await uploadProductLogo(productId, {
    bytes,
    contentType: imageExt === "jpg" ? "image/jpeg" : imageExt === "webp" ? "image/webp" : "image/png",
    ext: imageExt,
  });
  await supabaseServer.storage.from(BUCKET).remove([pendingPath]);
}

export async function productHasUploadedLogo(productId: string): Promise<boolean> {
  if (!isProductId(productId)) return false;
  const { data } = await supabaseServer
    .from("products")
    .select("logo_url")
    .eq("id", productId)
    .maybeSingle();
  return Boolean(data?.logo_url);
}

export async function isCurrentProductLogoUrl(href: string): Promise<boolean> {
  if (!isStoredProductLogoUrl(href)) return false;
  const { data } = await supabaseServer
    .from("products")
    .select("id")
    .eq("logo_url", href)
    .limit(1);
  return Boolean(data?.[0]);
}

export async function getStoredProductLogo(
  productId: string
): Promise<{ body: Blob; type: string } | null> {
  if (!isProductId(productId)) return null;
  if (!(await productHasUploadedLogo(productId))) return null;

  for (const ext of EXTS) {
    const { data, error } = await supabaseServer.storage.from(BUCKET).download(objectPath(productId, ext));
    if (error || !data) continue;
    return {
      body: data,
      type: ext === "jpg" ? "image/jpeg" : ext === "webp" ? "image/webp" : "image/png",
    };
  }
  return null;
}
