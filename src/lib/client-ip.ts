export function clientIp(request: Request): string {
  const cloudflare = request.headers.get("cf-connecting-ip");
  const vercel = request.headers.get("x-vercel-forwarded-for");
  const forwarded = request.headers.get("x-forwarded-for");
  const real = request.headers.get("x-real-ip");
  const raw = cloudflare || vercel || forwarded || real || "";
  const ip = raw.split(",")[0]?.trim() || "";
  return ip || "unknown";
}
