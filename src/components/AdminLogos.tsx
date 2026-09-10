"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Search, Upload } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getProductLogoUrl, handleLogoError } from "@/lib/logo";
import type { Product } from "@/types";

async function fitLogoToSquare(file: File): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Could not read that image"));
      el.src = objectUrl;
    });

    const size = 512;
    const pad = 48;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const scale = Math.min((size - pad * 2) / img.width, (size - pad * 2) / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export default function AdminLogos() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [bust, setBust] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data, error: loadError } = await supabase
        .from("products")
        .select("id, name, url, price, category, logo_url")
        .order("price", { ascending: false })
        .order("created_at", { ascending: true });
      if (loadError) {
        setError(loadError.message);
        return;
      }
      setProducts((data as Product[]) ?? []);
    };
    void load();
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return products;
    return products.filter((item) =>
      [item.name, item.url, item.category].some((value) =>
        String(value || "").toLowerCase().includes(needle)
      )
    );
  }, [products, query]);

  const pickFile = useCallback((productId: string) => {
    setTargetId(productId);
    setError(null);
    fileRef.current?.click();
  }, []);

  const onFile = useCallback(
    async (file: File | undefined) => {
      const productId = targetId;
      setTargetId(null);
      if (!file || !productId) return;

      setUploadingId(productId);
      setError(null);
      try {
        const logoDataUrl = await fitLogoToSquare(file);
        const response = await fetch("/api/admin/product-logo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, logoDataUrl }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Upload failed");
        setBust((prev) => ({ ...prev, [productId]: Date.now() }));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploadingId(null);
      }
    },
    [targetId]
  );

  return (
    <main className="w-full px-4 md:px-8 pt-20 md:pt-24 pb-20">
      <div className="w-full max-w-[720px] mx-auto">
        <h1 className="text-[28px] md:text-[36px] font-semibold tracking-tight text-foreground">
          Replace a logo
        </h1>
        <p className="mt-2 text-[15px] text-secondary text-balance">
          When a listing&apos;s favicon comes out wrong, upload the real mark here. It replaces the
          auto-pulled logo on the leaderboard.
        </p>
        <button
          type="button"
          onClick={async () => {
            await fetch("/api/admin/logout", { method: "POST" });
            window.location.reload();
          }}
          className="mt-2 text-[12px] font-medium text-secondary hover:text-foreground"
        >
          Sign out
        </button>

        <div className="relative mt-5">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary/70" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or URL"
            className="w-full rounded-full border border-border bg-white/70 pl-10 pr-4 py-2.5 text-sm font-medium outline-none focus:border-accent"
          />
        </div>

        {error && (
          <p className="mt-3 rounded-xl bg-accent/10 border border-accent/30 px-3.5 py-2 text-[13px] font-medium text-accent-dark">
            {error}
          </p>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            void onFile(file);
          }}
        />

        <ul className="mt-6 flex flex-col">
          {filtered.map((item) => {
            const src = `${getProductLogoUrl(item)}${bust[item.id] ? `&v=${bust[item.id]}` : ""}`;
            const busy = uploadingId === item.id;
            return (
              <li
                key={item.id}
                className="flex items-center gap-3 py-3 border-b border-border/50"
              >
                <div className="relative shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-muted border border-border/40">
                  <img
                    src={src}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover bg-white"
                    onError={(e) => handleLogoError(e.currentTarget, item.url)}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold tracking-tight text-foreground truncate">
                    {item.name}
                  </p>
                  <p className="text-[12px] text-secondary truncate">
                    {item.url?.replace(/^https?:\/\//, "")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => pickFile(item.id)}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 shrink-0 rounded-full bg-foreground text-background px-3.5 py-1.5 text-[12px] font-semibold hover:bg-accent hover:text-foreground transition-colors disabled:opacity-50"
                >
                  {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  {busy ? "Saving" : "Upload"}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
