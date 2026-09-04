"use client";

import { ArrowRight } from "lucide-react";

export default function Pricing() {
  const hopNow = (e: React.MouseEvent) => {
    e.preventDefault();
    const hopSection = document.getElementById("submit");
    if (hopSection) {
      hopSection.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <section id="pricing" className="w-full px-4 md:px-8 py-16 md:py-20 flex flex-col items-center border-t border-border/50">
      <div className="w-full max-w-[1000px] flex flex-col items-center text-center">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-3">
          Pricing
        </h2>
        <p className="text-base md:text-lg text-secondary mb-8 max-w-[440px]">
          One payment. Permanent listing. No subscriptions.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-base text-secondary mb-8">
          <span>
            <span className="font-semibold text-accent text-lg">$2</span> minimum
            <span className="text-secondary/70"> · $1 for .lol</span>
          </span>
          <span className="text-border hidden sm:inline">·</span>
          <span>
            pay more to <span className="font-semibold text-foreground">rank higher</span>
          </span>
          <span className="text-border hidden sm:inline">·</span>
          <span>
            hop again <span className="font-semibold text-foreground">anytime</span>
          </span>
        </div>

        <button
          onClick={hopNow}
          className="group inline-flex items-center justify-center gap-1.5 bg-foreground text-background px-6 py-2.5 rounded-full text-base font-semibold hover:bg-accent hover:text-foreground transition-colors"
        >
          Hop your product
          <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
        </button>
      </div>
    </section>
  );
}
