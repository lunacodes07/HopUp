"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight, Trophy, Sparkles, Info } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const toggleMenu = () => setIsOpen(!isOpen);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4 md:px-8 pointer-events-none">
      <motion.nav 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={`w-full max-w-6xl pointer-events-auto rounded-full flex items-center justify-between px-5 md:px-6 py-3.5 transition-all duration-300 ${
          scrolled 
            ? "bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg shadow-black/[0.03]" 
            : "bg-white/50 backdrop-blur-md border border-white/40 shadow-sm"
        }`}
      >
        {/* Logo */}
        <div className="flex-1">
          <Link href="/" className="text-xl md:text-2xl font-bold tracking-tight z-50 flex items-center gap-1.5 group">
            <span className="text-foreground transition-colors group-hover:text-accent">Hop</span>
            <span className="text-accent bg-accent/10 px-2.5 py-0.5 rounded-full border border-accent/20 shadow-[0_0_15px_rgba(var(--accent),0.1)] group-hover:shadow-[0_0_20px_rgba(var(--accent),0.2)] transition-shadow">
              Up
            </span>
          </Link>
        </div>

        {/* Desktop Nav - Middle */}
        <div className="hidden md:flex flex-1 justify-center">
          <div className="flex items-center gap-1 bg-muted/40 p-1.5 rounded-full border border-border/50">
            <Link
              href="/#leaderboard"
              onClick={(e) => {
                if (pathname === "/") {
                  e.preventDefault();
                  document.getElementById('leaderboard')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold text-secondary hover:text-foreground hover:bg-white hover:shadow-sm transition-all duration-300"
            >
              <Trophy className="w-4 h-4 text-amber-500" />
              Leaderboard
            </Link>
            <Link
              href="/about"
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                pathname === "/about" 
                  ? "text-foreground bg-white shadow-sm" 
                  : "text-secondary hover:text-foreground hover:bg-white hover:shadow-sm"
              }`}
            >
              <Info className="w-4 h-4 text-blue-500" />
              About
            </Link>
          </div>
        </div>

        {/* Desktop CTA - Right */}
        <div className="hidden md:flex flex-1 justify-end">
          <button
            onClick={() => {
              if (pathname === "/") {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                router.push("/");
              }
            }}
            className="group relative inline-flex items-center gap-2 bg-foreground text-background px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-accent/20"
          >
            <span className="relative z-10 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              Hop your product
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </span>
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-accent/0 via-accent/20 to-accent/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </button>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden z-50 p-2 -mr-2 text-foreground bg-muted/50 rounded-full"
          onClick={toggleMenu}
          aria-label="Toggle Menu"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-[110%] left-0 right-0 bg-white/95 backdrop-blur-xl border border-white/50 rounded-3xl p-6 shadow-2xl flex flex-col items-center gap-6 md:hidden mx-0"
            >
              <Link
                href="/#leaderboard"
                className="flex items-center gap-2 text-xl font-semibold hover:text-accent transition-colors"
                onClick={(e) => {
                  if (pathname === "/") {
                    e.preventDefault();
                    setIsOpen(false);
                    document.getElementById('leaderboard')?.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    setIsOpen(false);
                  }
                }}
              >
                <Trophy className="w-5 h-5 text-amber-500" />
                Leaderboard
              </Link>
              
              <Link
                href="/about"
                className={`flex items-center gap-2 text-xl font-semibold transition-colors ${
                  pathname === "/about" ? "text-accent" : "hover:text-accent"
                }`}
                onClick={() => setIsOpen(false)}
              >
                <Info className="w-5 h-5 text-blue-500" />
                About
              </Link>
              
              <button
                onClick={() => {
                  setIsOpen(false);
                  if (pathname === "/") {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  } else {
                    router.push("/");
                  }
                }}
                className="w-full group relative inline-flex items-center justify-center gap-2 bg-foreground text-background px-6 py-3.5 rounded-full text-base font-semibold transition-all duration-300 shadow-lg"
              >
                <Sparkles className="w-5 h-5 text-accent" />
                Hop your product
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </div>
  );
}
