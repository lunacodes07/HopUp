"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight } from "lucide-react";
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
    <div className="fixed top-3 left-0 right-0 z-50 flex justify-center px-4 md:px-8 pointer-events-none">
      <motion.nav 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={`w-full max-w-[1000px] pointer-events-auto rounded-full flex items-center justify-between px-4 md:px-5 py-2.5 transition-all duration-300 ${
          scrolled
            ? "bg-white/80 backdrop-blur-xl border border-white/50 shadow-sm"
            : "bg-white/50 backdrop-blur-md border border-white/40"
        }`}
      >
        {/* Logo */}
        <div className="flex-1">
          <Link href="/" className="text-lg md:text-xl font-semibold tracking-tight z-50 flex items-center gap-2 group">
            <img src="/hoplogo.png" alt="HopUp Logo" className="w-8 h-8 md:w-9 md:h-9 object-contain group-hover:scale-105 transition-transform" />
            <div className="flex items-baseline">
              <span className="text-foreground">HopUp.</span>
              <span className="text-accent">lol</span>
            </div>
          </Link>
        </div>

        {/* Desktop Nav - Middle */}
        <div className="hidden md:flex flex-1 justify-center">
          <div className="flex items-center gap-5">
            <Link
              href="/#leaderboard"
              onClick={(e) => {
                if (pathname === "/") {
                  e.preventDefault();
                  document.getElementById('leaderboard')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="text-sm font-medium text-secondary hover:text-foreground transition-colors"
            >
              Leaderboard
            </Link>
            <Link
              href="/p"
              className={`text-sm font-medium transition-colors ${
                pathname.startsWith("/p")
                  ? "text-foreground"
                  : "text-secondary hover:text-foreground"
              }`}
            >
              Listings
            </Link>
            <Link
              href="/about"
              className={`text-sm font-medium transition-colors ${
                pathname === "/about"
                  ? "text-foreground"
                  : "text-secondary hover:text-foreground"
              }`}
            >
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
            className="group inline-flex items-center gap-1.5 bg-foreground text-background px-5 py-2 rounded-full text-sm font-semibold hover:bg-accent hover:text-foreground transition-colors"
          >
              Hop your product
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
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
              className="absolute top-[110%] left-0 right-0 bg-white/95 backdrop-blur-xl border border-white/50 rounded-2xl p-5 shadow-lg flex flex-col items-center gap-4 md:hidden mx-0"
            >
              <Link
                href="/#leaderboard"
                className="text-sm font-medium text-secondary hover:text-foreground transition-colors"
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
                Leaderboard
              </Link>
              <Link
                href="/p"
                className={`text-sm font-medium transition-colors ${
                  pathname.startsWith("/p") ? "text-foreground" : "text-secondary hover:text-foreground"
                }`}
                onClick={() => setIsOpen(false)}
              >
                Listings
              </Link>
              
              <Link
                href="/about"
                className={`text-sm font-medium transition-colors ${
                  pathname === "/about" ? "text-foreground" : "text-secondary hover:text-foreground"
                }`}
                onClick={() => setIsOpen(false)}
              >
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
                className="inline-flex items-center justify-center gap-1.5 bg-foreground text-background px-5 py-2 rounded-full text-sm font-semibold"
              >
                Hop your product
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </div>
  );
}
