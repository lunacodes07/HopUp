import { deflateSync, inflateSync } from "zlib";
import { supabaseServer } from "@/lib/supabase-server";
import { isStoredProductLogoUrl, storeProductLogo } from "@/lib/product-logo-server";

const SIZE = 512;
const PAD = 48;
const EMPTY = 12;

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function decodePngRgba(bytes: Buffer): { width: number; height: number; rgba: Uint8Array } | null {
  if (bytes.length < 33) return null;
  if (bytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") return null;

  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idat: Buffer[] = [];
  let offset = 8;

  while (offset + 12 <= bytes.length) {
    const length = bytes.readUInt32BE(offset);
    const type = bytes.subarray(offset + 4, offset + 8).toString("ascii");
    const data = bytes.subarray(offset + 8, offset + 8 + length);
    offset += 12 + length;
    if (type === "IHDR") {
      if (data.length < 13) return null;
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      if (data[10] !== 0 || data[12] !== 0) return null;
    } else if (type === "IDAT") {
      idat.push(Buffer.from(data));
    } else if (type === "IEND") {
      break;
    }
  }

  if (!width || !height || bitDepth !== 8) return null;
  if (colorType !== 2 && colorType !== 6) return null;

  const bpp = colorType === 6 ? 4 : 3;
  let raw: Buffer;
  try {
    raw = inflateSync(Buffer.concat(idat));
  } catch {
    return null;
  }

  const stride = width * bpp;
  if (raw.length < height * (stride + 1)) return null;

  const recon = Buffer.alloc(height * stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const src = y * (stride + 1) + 1;
    const dst = y * stride;
    for (let i = 0; i < stride; i++) {
      const x = raw[src + i];
      const a = i >= bpp ? recon[dst + i - bpp] : 0;
      const b = y > 0 ? recon[dst - stride + i] : 0;
      const c = y > 0 && i >= bpp ? recon[dst - stride + i - bpp] : 0;
      let val = x;
      if (filter === 1) val = x + a;
      else if (filter === 2) val = x + b;
      else if (filter === 3) val = x + Math.floor((a + b) / 2);
      else if (filter === 4) val = x + paeth(a, b, c);
      else if (filter !== 0) return null;
      recon[dst + i] = val & 0xff;
    }
  }

  if (bpp === 4) return { width, height, rgba: new Uint8Array(recon) };

  const rgba = new Uint8Array(width * height * 4);
  for (let i = 0, j = 0; i < recon.length; i += 3, j += 4) {
    rgba[j] = recon[i];
    rgba[j + 1] = recon[i + 1];
    rgba[j + 2] = recon[i + 2];
    rgba[j + 3] = 255;
  }
  return { width, height, rgba };
}

function encodePngRgba(width: number, height: number, rgba: Uint8Array): Buffer {
  const stride = width * 4;
  const raw = Buffer.alloc(height * (stride + 1));
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    raw.set(rgba.subarray(y * stride, y * stride + stride), y * (stride + 1) + 1);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;

  const chunks = [
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ];
  return Buffer.concat(chunks);
}

function chunk(type: string, data: Buffer): Buffer {
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  body.copy(out, 4);
  out.writeUInt32BE(crc32(body), 8 + data.length);
  return out;
}

function alphaAt(rgba: Uint8Array, width: number, x: number, y: number): number {
  return rgba[(y * width + x) * 4 + 3];
}

function hasEmptyPad(rgba: Uint8Array, width: number, height: number, pad: number): boolean {
  if (width <= pad * 2 || height <= pad * 2) return false;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const onBorder = y < pad || y >= height - pad || x < pad || x >= width - pad;
      if (onBorder && alphaAt(rgba, width, x, y) >= EMPTY) return false;
    }
  }
  return true;
}

function contentBox(rgba: Uint8Array, width: number, height: number) {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (alphaAt(rgba, width, x, y) < EMPTY) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < minX || maxY < minY) return null;
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

function coverFit(
  src: Uint8Array,
  srcW: number,
  box: { x: number; y: number; w: number; h: number }
): Uint8Array {
  const dest = new Uint8Array(SIZE * SIZE * 4);
  const scale = Math.max(SIZE / box.w, SIZE / box.h);
  const dw = box.w * scale;
  const dh = box.h * scale;
  const ox = (SIZE - dw) / 2;
  const oy = (SIZE - dh) / 2;

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const sx = Math.floor((x - ox) / scale + box.x);
      const sy = Math.floor((y - oy) / scale + box.y);
      if (sx < box.x || sy < box.y || sx >= box.x + box.w || sy >= box.y + box.h) continue;
      if (sx < 0 || sy < 0 || sx >= srcW) continue;
      dest.set(src.subarray((sy * srcW + sx) * 4, (sy * srcW + sx) * 4 + 4), (y * SIZE + x) * 4);
    }
  }
  return dest;
}

/** Crop a 512 logo that still has the old 48px inset. Returns null when the file is already fine. */
export function unpadProductLogoBytes(bytes: Buffer): Buffer | null {
  const decoded = decodePngRgba(bytes);
  if (!decoded) return null;
  if (decoded.width !== SIZE || decoded.height !== SIZE) return null;
  if (!hasEmptyPad(decoded.rgba, decoded.width, decoded.height, PAD)) return null;
  const box = contentBox(decoded.rgba, decoded.width, decoded.height);
  if (!box) return null;
  return encodePngRgba(SIZE, SIZE, coverFit(decoded.rgba, decoded.width, box));
}

export async function backfillPaddedProductLogos() {
  const { data, error } = await supabaseServer
    .from("products")
    .select("id, logo_url")
    .not("logo_url", "is", null);

  if (error) {
    console.error("Padded logo list failed:", error);
    throw new Error("Could not list listing logos.");
  }

  let scanned = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of data ?? []) {
    const id = typeof row.id === "string" ? row.id : "";
    const logoUrl = typeof row.logo_url === "string" ? row.logo_url : "";
    if (!id || !isStoredProductLogoUrl(logoUrl)) {
      skipped += 1;
      continue;
    }

    scanned += 1;
    try {
      const image = await fetch(logoUrl);
      if (!image.ok) {
        skipped += 1;
        continue;
      }
      const bytes = Buffer.from(await image.arrayBuffer());
      const fixed = unpadProductLogoBytes(bytes);
      if (!fixed) {
        skipped += 1;
        continue;
      }
      await storeProductLogo(id, `data:image/png;base64,${fixed.toString("base64")}`);
      updated += 1;
    } catch (err) {
      console.error("Padded logo fix failed:", id, err);
      skipped += 1;
    }
  }

  return { scanned, updated, skipped };
}
