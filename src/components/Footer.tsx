import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full bg-background border-t border-border/50 pt-16 pb-12 px-6 md:px-12 flex flex-col items-center">
      <div className="w-full max-w-[1000px] flex flex-col md:flex-row justify-between items-start md:items-center gap-10 mb-12">
        <div className="flex flex-col gap-1">
          <div className="text-2xl font-bold tracking-tight flex items-center gap-1">
            Hop<span className="text-accent bg-accent/10 px-2 py-0.5 rounded-full text-lg">Up</span>
          </div>
          <p className="text-secondary font-medium text-sm mt-1">
            Pay to hop higher.
          </p>
        </div>

        <div className="flex flex-wrap gap-6 md:gap-8">
          <Link href="#leaderboard" className="text-sm font-semibold text-secondary hover:text-foreground transition-colors">
            Leaderboard
          </Link>

          <Link href="#" className="text-sm font-semibold text-secondary hover:text-foreground transition-colors">
            X (Twitter)
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
