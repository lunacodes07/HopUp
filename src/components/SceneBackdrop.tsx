/**
 * Fixed scene behind every page. Soft, washed colour so type stays in front.
 * No filter: blur on the blobs — that stays cheap on mobile.
 */
export default function SceneBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
      <div
        className="absolute -left-[18%] -top-[26%] h-[70vh] w-[70vw] min-w-[520px] rounded-full animate-drift-slow will-change-transform"
        style={{
          background:
            "radial-gradient(closest-side, rgba(233,226,255,0.42) 0%, rgba(233,226,255,0.16) 45%, rgba(233,226,255,0) 100%)",
        }}
      />
      <div
        className="absolute -right-[14%] top-[6%] h-[62vh] w-[52vw] min-w-[440px] rounded-full animate-drift will-change-transform"
        style={{
          background:
            "radial-gradient(closest-side, rgba(255,122,31,0.12) 0%, rgba(255,160,90,0.06) 45%, rgba(255,122,31,0) 100%)",
        }}
      />
      <div
        className="absolute -left-[8%] bottom-[-18%] h-[56vh] w-[48vw] min-w-[380px] rounded-full animate-drift will-change-transform [animation-delay:-9s]"
        style={{
          background:
            "radial-gradient(closest-side, rgba(255,212,71,0.16) 0%, rgba(255,212,71,0.06) 50%, rgba(255,212,71,0) 100%)",
        }}
      />
      <div
        className="absolute -right-[10%] bottom-[-22%] h-[60vh] w-[50vw] min-w-[400px] rounded-full animate-drift-slow will-change-transform [animation-delay:-14s]"
        style={{
          background:
            "radial-gradient(closest-side, rgba(124,58,237,0.08) 0%, rgba(233,226,255,0.12) 45%, rgba(124,58,237,0) 100%)",
        }}
      />
      <div
        className="absolute left-[46%] top-[42%] h-[28vh] w-[24vw] min-w-[220px] rounded-full animate-drift will-change-transform [animation-delay:-20s]"
        style={{
          background:
            "radial-gradient(closest-side, rgba(159,231,199,0.16) 0%, rgba(159,231,199,0) 100%)",
        }}
      />

      <svg
        className="absolute right-[3%] top-[9%] hidden h-[74px] w-[92px] text-butter/35 md:block"
        viewBox="0 0 92 74"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 56 L6 22 L28 38 L46 10 L64 38 L86 22 L80 56 Z" />
        <path d="M14 64 H78" />
        <circle cx="6" cy="20" r="3" fill="currentColor" stroke="none" />
        <circle cx="46" cy="8" r="3" fill="currentColor" stroke="none" />
        <circle cx="86" cy="20" r="3" fill="currentColor" stroke="none" />
      </svg>
      <svg
        className="absolute left-[4%] top-[34%] hidden h-10 w-10 text-accent/25 lg:block"
        viewBox="0 0 40 40"
        fill="currentColor"
      >
        <path d="M20 2 C21 12 28 19 38 20 C28 21 21 28 20 38 C19 28 12 21 2 20 C12 19 19 12 20 2 Z" />
      </svg>
      <svg
        className="absolute left-[9%] top-[62%] hidden h-5 w-5 text-grape/20 lg:block"
        viewBox="0 0 40 40"
        fill="currentColor"
      >
        <path d="M20 2 C21 12 28 19 38 20 C28 21 21 28 20 38 C19 28 12 21 2 20 C12 19 19 12 20 2 Z" />
      </svg>
      <span className="absolute left-[22%] top-[18%] hidden h-2 w-3.5 rotate-[24deg] rounded-[2px] bg-accent/25 md:block" />
      <span className="absolute right-[24%] top-[30%] hidden h-2 w-3.5 -rotate-[18deg] rounded-[2px] bg-grape/20 md:block" />
      <span className="absolute left-[16%] bottom-[28%] hidden h-2 w-3.5 rotate-[40deg] rounded-[2px] bg-butter/40 md:block" />
      <span className="absolute right-[12%] bottom-[38%] hidden h-2 w-3.5 -rotate-[32deg] rounded-[2px] bg-bubblegum/30 md:block" />

      <img
        src="/theme/hoppy-leader.png"
        alt=""
        width={244}
        height={304}
        loading="lazy"
        decoding="async"
        className="absolute right-[2%] bottom-0 hidden w-[200px] max-w-[16vw] select-none opacity-[0.18] lg:block xl:w-[230px]"
      />

      {/* Cream veil — keeps colour in the room without fighting the type. */}
      <div className="absolute inset-0 bg-background/55" />
      <div className="absolute inset-0 grain opacity-[0.035] mix-blend-multiply" />
    </div>
  );
}
