import Link from "next/link";
import { TinyshelfBadge } from "./TinyshelfBadge";

export default function Footer() {
  return (
    <footer className="w-full mt-2 border-t border-foreground/10 px-5 md:px-10 lg:px-14 py-6 md:py-7">
      <div className="w-full flex flex-col items-center gap-5">
        <div className="w-full flex flex-col items-center gap-4 lg:flex-row lg:justify-between lg:items-center">
          <Link href="/" className="group flex items-center gap-2 text-base font-semibold tracking-tight">
            <img
              src="/theme/hoppy-wink.png"
              alt=""
              width={118}
              height={159}
              className="h-9 w-auto -my-1 animate-hoppy-bob select-none transition-transform group-hover:scale-110"
            />
            <span>
              HopUp.<span className="text-accent">lol</span>
            </span>
          </Link>

          <nav className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1 text-sm font-medium text-secondary">
            {[
              ["/#leaderboard", "Leaderboard"],
              ["/p", "Listings"],
              ["/#testimonials", "Testimonials"],
              ["/contact", "Contact"],
              ["/terms", "Terms"],
              ["/privacy", "Privacy"],
              ["/refunds", "Refunds"],
            ].map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className="rounded-full px-2.5 py-1 transition-colors hover:bg-white/70 hover:text-foreground"
              >
                {label}
              </Link>
            ))}
          </nav>

          <span className="inline-flex items-center gap-1.5 text-xs text-secondary/70">
            <span className="inline-flex gap-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              <span className="h-1.5 w-1.5 rounded-full bg-grape" />
              <span className="h-1.5 w-1.5 rounded-full bg-butter" />
            </span>
            © 2026
          </span>
        </div>

        <div className="flex w-full flex-nowrap items-center justify-center gap-1.5 sm:gap-3 overflow-x-auto no-scrollbar">
          <a
            href="https://www.producthunt.com/products/hopup?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-hopup"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 opacity-90 transition-opacity hover:opacity-100"
          >
            <img
              alt="HopUp - Your Product Deserves a Better Spot | Product Hunt"
              width={180}
              height={39}
              className="h-[22px] sm:h-8 w-auto"
              src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1238456&theme=light&t=1788265340921"
            />
          </a>
          <TinyshelfBadge className="h-[22px] sm:h-8 w-auto" />
          <a
            href="https://frogdr.com/hopup.lol?utm_source=hopup.lol"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 opacity-90 transition-opacity hover:opacity-100"
          >
            <img
              alt="Monitor your Domain Rating with FrogDR"
              width={250}
              height={54}
              className="h-[26px] sm:h-11 w-auto"
              src="https://frogdr.com/hopup.lol/badge-white.svg?badge=1&round=1"
            />
          </a>
        </div>
      </div>
    </footer>
  );
}
