"use client";

import { withHopupRef } from "@/lib/product-path";
import { trackProductClick } from "@/lib/track-click";

type VisitSiteButtonProps = {
  productId: string;
  href: string;
  className?: string;
  children: React.ReactNode;
};

export default function VisitSiteButton({
  productId,
  href,
  className,
  children,
}: VisitSiteButtonProps) {
  const track = () => trackProductClick(productId);
  const outbound = withHopupRef(href) || href;

  return (
    <a
      href={outbound}
      target="_blank"
      rel="noopener noreferrer"
      onClick={track}
      onAuxClick={(e) => {
        if (e.button === 1) track();
      }}
      className={className}
    >
      {children}
    </a>
  );
}
