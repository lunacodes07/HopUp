"use client";

import { useState } from "react";
import { shareImagePath, type SharePayload } from "@/lib/share";

function fileName(payload: SharePayload) {
  const slug = payload.name.replace(/[^\w]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
  return `${slug || "hopup"}-card.png`;
}

export default function DownloadCardButton({
  payload,
  className,
  children = "Download PNG",
}: {
  payload: SharePayload;
  className?: string;
  children?: React.ReactNode;
}) {
  const [busy, setBusy] = useState(false);

  const download = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(shareImagePath(payload));
      if (!res.ok) throw new Error("Failed to load card");
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = fileName(payload);
      a.click();
      URL.revokeObjectURL(href);
    } catch (err) {
      console.error("Card download failed:", err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button type="button" onClick={() => void download()} disabled={busy} className={className}>
      {busy ? "Downloading…" : children}
    </button>
  );
}
