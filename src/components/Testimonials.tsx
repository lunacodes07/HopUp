type HoppyFace = "wink" | "cool" | "angry";

type Testimonial = {
  name: string;
  handle: string;
  date: string;
  posted: string;
  comment: string;
  tint: string;
  hoppy: HoppyFace;
  tilt: string;
};

const HOPPY: Record<HoppyFace, { src: string; w: number; h: number }> = {
  wink: { src: "/theme/hoppy-wink.png", w: 118, h: 159 },
  cool: { src: "/theme/hoppy-cool.png", w: 159, h: 160 },
  angry: { src: "/theme/hoppy-angry.png", w: 142, h: 189 },
};

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Maya Chen",
    handle: "mayabuilds",
    date: "Aug 12, 2026",
    posted: "2026-08-12",
    comment:
      "Paid $4, went to sleep, woke up at #11. Some guy hopped me at 3am. I hopped him back at breakfast. Most unhinged marketing I've done — and I booked three demos from it.",
    tint: "tint-orange",
    hoppy: "wink",
    tilt: "-rotate-1",
  },
  {
    name: "Ravi Patel",
    handle: "raviships",
    date: "Aug 28, 2026",
    posted: "2026-08-28",
    comment:
      "Listed my .lol for a dollar because the page said I could. Then I wouldn't shut up about being on the board. Two investors asked what HopUp was. That's the whole pitch.",
    tint: "tint-grape",
    hoppy: "cool",
    tilt: "rotate-1",
  },
  {
    name: "Jules Mora",
    handle: "julesmora",
    date: "Sep 3, 2026",
    posted: "2026-09-03",
    comment:
      "Told my cofounder we were not paying $65 to sit on a gold row. We paid $66. Worth it for the screenshot alone.",
    tint: "tint-butter",
    hoppy: "angry",
    tilt: "-rotate-2",
  },
  {
    name: "Theo Park",
    handle: "theopark",
    date: "Sep 9, 2026",
    posted: "2026-09-09",
    comment:
      "Put our logo on Aloha's Stanley for $35. A stranger in a cafe asked whose cup that was. I have never had a banner ad do that.",
    tint: "tint-mint",
    hoppy: "cool",
    tilt: "rotate-2",
  },
  {
    name: "Nina Okonkwo",
    handle: "ninabuilds",
    date: "Jul 22, 2026",
    posted: "2026-07-22",
    comment:
      "Clicked hop as a joke. Someone from a newsletter I actually read emailed the next day. $2 is cheaper than my coffee and louder than my last launch.",
    tint: "tint-bubblegum",
    hoppy: "wink",
    tilt: "-rotate-1",
  },
  {
    name: "Samir Ali",
    handle: "samirstacks",
    date: "Sep 14, 2026",
    posted: "2026-09-14",
    comment:
      "Held #7 for a week, then got hopped. Didn't even mind. The hop notification is the product. People check the board just to see who moved.",
    tint: "tint-orange",
    hoppy: "angry",
    tilt: "rotate-1",
  },
];

function XMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  );
}

function TestimonialCard({ item }: { item: Testimonial }) {
  const face = HOPPY[item.hoppy];

  return (
    <article
      className={`quote-card glass-row ${item.tint} ${item.tilt} relative w-[300px] sm:w-[340px] shrink-0 rounded-[28px] px-5 pt-5 pb-4`}
    >
      <img
        src={face.src}
        alt=""
        width={face.w}
        height={face.h}
        className="pointer-events-none absolute -top-4 -right-3 h-16 w-auto select-none drop-shadow-[0_8px_12px_rgba(45,41,38,0.18)] sm:h-[72px]"
      />

      <header className="pr-14">
        <p className="text-[16px] font-semibold tracking-tight text-foreground truncate">{item.name}</p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <a
            href={`https://x.com/${item.handle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-0.5 text-[12px] font-semibold text-foreground hover:bg-white transition-colors"
          >
            <XMark className="h-3 w-3" />
            @{item.handle}
          </a>
          <time
            className="rounded-full bg-foreground/5 px-2 py-0.5 text-[11px] tabular-nums text-secondary"
            dateTime={item.posted}
          >
            {item.date}
          </time>
        </div>
      </header>

      <p className="mt-3 text-[14px] leading-relaxed text-foreground/90">“{item.comment}”</p>
    </article>
  );
}

export default function Testimonials() {
  const loop = [...TESTIMONIALS, ...TESTIMONIALS];

  return (
    <section id="testimonials" className="w-full pt-2 pb-12 md:pb-14">
      <div className="page-wide mx-auto px-4 md:px-8 mb-5 flex items-end justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent-dark">
            From the timeline
          </p>
          <h2 className="mt-1 text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
            People hopped. Then they talked.
          </h2>
        </div>
        <p className="hidden sm:block text-[12px] text-secondary/80">Hover a card to pause</p>
      </div>

      <div className="group/marquee fade-x overflow-hidden py-6">
        <ul className="testimonial-track flex w-max items-stretch gap-4 pr-4 motion-safe:animate-testimonial-marquee group-hover/marquee:[animation-play-state:paused]">
          {loop.map((item, i) => (
            <li key={`${item.handle}-${i}`} className="pt-2">
              <TestimonialCard item={item} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
