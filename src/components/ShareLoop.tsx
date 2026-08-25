"use client";

import { motion } from "framer-motion";
import { ArrowRight, ArrowDown } from "lucide-react";
import Link from "next/link";

export default function ShareLoop() {
  const loopSteps = [
    "Founder posts",
    "Audience visits",
    "Someone sees the board",
    "Someone lists",
    "Someone hops",
    "Repeat"
  ];

  return (
    <section className="w-full bg-muted/40 py-32 px-6 md:px-12 flex flex-col items-center">
      <div className="max-w-[1100px] w-full flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
        
        {/* Left Side - The Post */}
        <div className="w-full lg:w-1/2 flex flex-col">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight text-foreground mb-10"
          >
            Make your<br />
            spot public.
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 30, rotate: -1 }}
            whileInView={{ opacity: 1, y: 0, rotate: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white border border-border/60 p-6 md:p-8 rounded-3xl max-w-[460px] shadow-lg shadow-black/5 relative group"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-accent/20 rounded-full overflow-hidden flex items-center justify-center font-bold text-accent-dark">
                F
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-foreground text-sm">Founder</span>
                <span className="text-xs text-secondary">@founder</span>
              </div>
            </div>
            
            <p className="text-base md:text-lg font-medium text-foreground/90 mb-8 whitespace-pre-wrap leading-relaxed">
              just hopped to #7 on @hopuplol<br/><br/>
              $42 → #7<br/><br/>
              someone's gonna have to pay more 😂
            </p>

            <Link
              href="#"
              className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-accent transition-all duration-300 shadow-md"
            >
              Share on X
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>

            <div className="absolute -bottom-4 -right-4 text-xs font-semibold text-accent-dark bg-accent/20 backdrop-blur-sm border border-accent/20 px-4 py-2 rounded-full rotate-[-3deg] group-hover:rotate-0 transition-transform shadow-sm">
              Every hop is an excuse to post.
            </div>
          </motion.div>
        </div>

        {/* Right Side - The Loop */}
        <div className="w-full lg:w-1/2 flex justify-center lg:justify-end">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col items-center max-w-[360px] w-full"
          >
            {loopSteps.map((step, idx) => (
              <div key={idx} className="flex flex-col items-center w-full">
                <div className={`w-full py-4 px-6 text-center rounded-2xl font-semibold text-base transition-colors ${
                  idx === loopSteps.length - 1 
                    ? "bg-accent/20 border border-accent/30 text-accent-dark mt-2 border-dashed shadow-sm" 
                    : "bg-white border border-border/50 text-foreground shadow-sm"
                }`}>
                  {step}
                </div>
                {idx !== loopSteps.length - 1 && (
                  <div className="py-2.5 text-border">
                    <ArrowDown className="w-5 h-5" />
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        </div>

      </div>
    </section>
  );
}
