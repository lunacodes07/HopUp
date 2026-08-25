import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full bg-background border-t border-border/50 pt-16 pb-12 px-6 md:px-12 flex flex-col items-center">
      <div className="w-full max-w-[1000px] flex flex-col md:flex-row justify-between items-start md:items-center gap-10 mb-12">
        <div className="flex flex-col gap-1">
          <Link href="/" className="text-2xl font-bold tracking-tight flex items-center gap-2 group">
            <img src="/hoplogo.png" alt="HopUp Logo" className="w-10 h-10 object-contain drop-shadow-sm group-hover:scale-105 transition-transform" />
            <div className="flex items-baseline">
              <span className="text-foreground">HopUp.</span>
              <span className="text-accent">lol</span>
            </div>
          </Link>
          <p className="text-secondary font-medium text-sm mt-1">
            Pay to hop higher.
          </p>
        </div>

        <div className="flex flex-wrap gap-x-8 gap-y-4 md:justify-end">
          <Link href="/#leaderboard" className="text-sm font-semibold text-secondary hover:text-foreground transition-colors">
            Leaderboard
          </Link>
          <Link href="/#pricing" className="text-sm font-semibold text-secondary hover:text-foreground transition-colors">
            Pricing
          </Link>
          <Link href="/contact" className="text-sm font-semibold text-secondary hover:text-foreground transition-colors">
            Contact Support
          </Link>
          <Link href="/terms" className="text-sm font-semibold text-secondary hover:text-foreground transition-colors">
            Terms of Service
          </Link>
          <Link href="/privacy" className="text-sm font-semibold text-secondary hover:text-foreground transition-colors">
            Privacy Policy
          </Link>
          <Link href="/refunds" className="text-sm font-semibold text-secondary hover:text-foreground transition-colors">
            Refunds
          </Link>
        </div>
      </div>

      <div className="w-full max-w-[1000px] flex justify-between items-center text-xs font-medium text-secondary/60">
        <span>© 2026 HopUp</span>
        <span className="hidden md:inline-block">The internet's most unnecessary competition.</span>
      </div>
    </footer>
  );
}
