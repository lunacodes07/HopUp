"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Product } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { Activity } from "lucide-react";

const getTimeAgo = (dateString?: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
};

const getShortName = (name: string) => {
  const words = name.split(' ');
  if (words.length <= 2) return name;
  return `${words[0]} ${words[1]}...`;
};

export default function Ticker() {
  const [recentHops, setRecentHops] = useState<Product[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const fetchRecentHops = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("last_hopped_at", { ascending: false, nullsFirst: false })
        .limit(5);
        
      if (error) {
        if (error.message.includes("last_hopped_at")) {
           const { data: fallbackData } = await supabase
            .from("products")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(5);
           if (fallbackData) setRecentHops(fallbackData);
        }
      } else if (data) {
        setRecentHops(data);
      }
    } catch (err) {
      console.error("Failed to fetch ticker data:", err);
    }
  }, []);

  useEffect(() => {
    fetchRecentHops();

    const subscription = supabase
      .channel("ticker_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => {
          fetchRecentHops();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [fetchRecentHops]);

  // Cycle through the latest 5 every 3 seconds
  useEffect(() => {
    if (recentHops.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % recentHops.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [recentHops.length]);

  if (recentHops.length === 0) return null;

  const currentItem = recentHops[currentIndex];

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="inline-flex items-center gap-2 text-[10px] md:text-xs font-semibold text-secondary bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-border/50 shadow-sm overflow-hidden h-8"
    >
      <Activity className="w-3.5 h-3.5 text-accent flex-shrink-0" />
      <AnimatePresence mode="wait">
        <motion.div
          key={currentItem.id + currentIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-1.5 whitespace-nowrap"
        >
          <span className="text-foreground max-w-[80px] md:max-w-[150px] truncate">
            {getShortName(currentItem.name)}
          </span>
          <span className="opacity-75 font-normal">hopped</span>
          <span className="text-foreground/50 ml-0.5 font-normal">
            {getTimeAgo(currentItem.last_hopped_at || currentItem.created_at)}
          </span>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
