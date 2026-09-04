"use client";

import { useState } from "react";
import type { SharePayload } from "@/lib/share";
import ShareHopModal from "./ShareHopModal";

export default function ShareListingButton({
  payload,
  className,
}: {
  payload: SharePayload;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        Share
      </button>
      {open && (
        <ShareHopModal
          payload={payload}
          kicker="Share this listing"
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
