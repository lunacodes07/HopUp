/**
 * Hand-drawn SVG silhouettes for each Brand My Stuff object.
 * Kept as inline SVG so cards stay crisp at any size with zero image requests.
 */
export default function ObjectArt({ slug, tint }: { slug: string; tint: string }) {
  const stroke = "#2D2926";

  if (slug === "brandmystanley") {
    return (
      <svg viewBox="0 0 120 120" fill="none" className="w-full h-full" aria-hidden>
        {/* straw */}
        <path d="M66 8 L72 30" stroke={stroke} strokeWidth="5" strokeLinecap="round" opacity="0.85" />
        {/* lid */}
        <rect x="38" y="28" width="44" height="10" rx="4" fill={stroke} opacity="0.9" />
        <rect x="42" y="22" width="24" height="8" rx="3" fill={stroke} opacity="0.65" />
        {/* body: narrow base, wide top */}
        <path
          d="M41 38 L79 38 L76 74 C75.5 80 74 84 73 92 C72.4 98 70 104 66 104 L54 104 C50 104 47.6 98 47 92 C46 84 44.5 80 44 74 Z"
          fill={tint}
          opacity="0.9"
        />
        <path
          d="M41 38 L79 38 L76 74 C75.5 80 74 84 73 92 C72.4 98 70 104 66 104 L54 104 C50 104 47.6 98 47 92 C46 84 44.5 80 44 74 Z"
          stroke={stroke}
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {/* logo slot hint */}
        <rect x="50" y="52" width="20" height="16" rx="4" fill="#FFFFFF" opacity="0.85" />
        <path d="M56 62 L60 56 L64 62" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (slug === "brandmybackpack") {
    return (
      <svg viewBox="0 0 120 120" fill="none" className="w-full h-full" aria-hidden>
        <path d="M46 30 C46 20 74 20 74 30" stroke={stroke} strokeWidth="5" strokeLinecap="round" />
        <rect x="30" y="30" width="60" height="66" rx="18" fill={tint} opacity="0.9" />
        <rect x="30" y="30" width="60" height="66" rx="18" stroke={stroke} strokeWidth="3" />
        <rect x="42" y="62" width="36" height="26" rx="9" fill="#FFFFFF" opacity="0.85" />
        <rect x="42" y="62" width="36" height="26" rx="9" stroke={stroke} strokeWidth="2.4" />
        <path d="M42 46 L78 46" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" opacity="0.5" />
      </svg>
    );
  }

  if (slug === "brandmylaptop") {
    return (
      <svg viewBox="0 0 120 120" fill="none" className="w-full h-full" aria-hidden>
        <rect x="30" y="30" width="60" height="42" rx="5" fill={tint} opacity="0.9" />
        <rect x="30" y="30" width="60" height="42" rx="5" stroke={stroke} strokeWidth="3" />
        <circle cx="60" cy="51" r="8" fill="#FFFFFF" opacity="0.85" />
        <path d="M22 80 L98 80 L92 90 C91 91.6 89 92 87 92 L33 92 C31 92 29 91.6 28 90 Z" fill={stroke} opacity="0.85" />
      </svg>
    );
  }

  // phone
  return (
    <svg viewBox="0 0 120 120" fill="none" className="w-full h-full" aria-hidden>
      <rect x="40" y="18" width="40" height="84" rx="11" fill={tint} opacity="0.9" />
      <rect x="40" y="18" width="40" height="84" rx="11" stroke={stroke} strokeWidth="3" />
      <rect x="52" y="24" width="16" height="5" rx="2.5" fill={stroke} opacity="0.7" />
      <circle cx="60" cy="60" r="11" fill="#FFFFFF" opacity="0.85" />
      <path d="M55 60 L59 64 L66 55" stroke={stroke} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
