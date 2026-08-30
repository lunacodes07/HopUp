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
    </footer>
  );
}
