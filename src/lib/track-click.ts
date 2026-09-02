export function trackProductClick(productId: string) {
  if (!productId) return;

  void fetch("/api/click", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId }),
    keepalive: true,
  }).catch((err) => {
    console.error("Failed to track click:", err);
  });
}
