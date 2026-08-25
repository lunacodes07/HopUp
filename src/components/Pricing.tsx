"use client";

import { Check, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Pricing() {
  return (
    <section id="pricing" className="w-full py-24 bg-muted/30 relative flex flex-col items-center justify-center px-6 md:px-12 border-y border-border/50">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-muted/20 pointer-events-none"></div>
      
      <div className="w-full max-w-[1000px] flex flex-col items-center relative z-10 text-center">
        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
          Simple, Transparent Pricing
        </h2>
        <p className="text-secondary font-medium text-lg md:text-xl max-w-[600px] mb-16">
          No subscriptions, no hidden fees. Just pay once for a permanent listing and hop up the leaderboard.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-[900px] text-left">
          {/* Base Listing */}
          <div className="bg-background rounded-3xl p-8 border border-border shadow-sm flex flex-col relative overflow-hidden">
            <h3 className="text-2xl font-bold mb-2 text-foreground">Base Listing</h3>
            <div className="flex items-end gap-1 mb-6">
              <span className="text-4xl font-extrabold text-foreground">Pay what you want</span>
            </div>
            <p className="text-secondary text-sm font-medium mb-8">
              List your product on the board permanently. The minimum required bid is $2.00, but you decide how much you want to pay to claim your initial rank.
            </p>
            
            <ul className="flex flex-col gap-4 mb-10 flex-grow">
              {[
                "Permanent public listing",
                "Instant backlink and visibility",
                "Appears on the global leaderboard",
                "No recurring subscription fees"
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="bg-accent/10 p-1 rounded-full text-accent mt-0.5">
                    <Check className="w-4 h-4" />
                  </div>
                  <span className="text-foreground font-medium text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <Link href="#" onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }} className="w-full bg-foreground text-background py-3.5 px-6 rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 group">
              List Now
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Hop Up (Upgrade) */}
          <div className="bg-gradient-to-b from-accent/5 to-transparent rounded-3xl p-8 border border-accent/20 shadow-md shadow-accent/5 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-accent text-accent-foreground text-xs font-bold px-3 py-1.5 rounded-bl-xl uppercase tracking-wider">
              Existing Listings
            </div>
            
            <h3 className="text-2xl font-bold mb-2 text-foreground">Hop Up</h3>
            <div className="flex items-end gap-1 mb-6">
              <span className="text-4xl font-extrabold text-foreground">Custom Bid</span>
            </div>
            <p className="text-secondary text-sm font-medium mb-8">
              Already listed? You can pay to increase your total bid amount at any time to permanently jump ahead of competitors on the leaderboard.
            </p>
            
            <ul className="flex flex-col gap-4 mb-10 flex-grow">
              {[
                "Increase your leaderboard rank",
                "Stand out to potential customers",
                "Drive more direct clicks",
                "Cumulative bids (new bid adds to your total)"
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="bg-accent p-1 rounded-full text-accent-foreground mt-0.5">
                    <Check className="w-4 h-4" />
                  </div>
                  <span className="text-foreground font-medium text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <Link href="#" onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }} className="w-full bg-accent text-accent-foreground py-3.5 px-6 rounded-xl font-bold hover:bg-accent/90 transition-colors flex items-center justify-center gap-2 group">
              Increase Bid
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
