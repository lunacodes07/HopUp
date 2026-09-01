import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full border-t border-border/50 px-4 md:px-8 py-8 flex flex-col items-center">
      <div className="w-full max-w-[1000px] flex flex-col items-center gap-4 md:flex-row md:justify-between md:items-center">
        <Link href="/" className="text-base font-semibold tracking-tight">
          HopUp.<span className="text-accent">lol</span>
        </Link>

        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm font-medium text-secondary">
          <Link href="/#leaderboard" className="hover:text-foreground transition-colors">
            Leaderboard
          </Link>
          <Link href="/#pricing" className="hover:text-foreground transition-colors">
            Pricing
          </Link>
          <Link href="/contact" className="hover:text-foreground transition-colors">
            Contact
          </Link>
          <Link href="/terms" className="hover:text-foreground transition-colors">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            Privacy
          </Link>
          <Link href="/refunds" className="hover:text-foreground transition-colors">
            Refunds
          </Link>
        </nav>

        <span className="text-xs text-secondary/60">© 2026</span>
      </div>

      <a
        href="https://www.producthunt.com/products/hopup?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-hopup"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 opacity-90 transition-opacity hover:opacity-100"
      >
        <img
          alt="HopUp - Your Product Deserves a Better Spot | Product Hunt"
          width={180}
          height={39}
          className="h-[39px] w-[180px]"
          src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1238456&theme=light&t=1788265340921"
        />
      </a>
    </footer>
  );
}
