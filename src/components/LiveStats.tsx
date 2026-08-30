"use client";

import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { supabase } from "@/lib/supabase";

import { motion } from "framer-motion";

// Module-level flag to prevent React Strict Mode double-firing
let hasIncrementedPageView = false;

export default function LiveStats() {
  const [liveUsers, setLiveUsers] = useState<number>(1);
  const [totalVisits, setTotalVisits] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let roomOne: ReturnType<typeof supabase.channel>;

    const setupStats = async () => {
      if (!supabase) return;

      try {
        // 1. Increment and fetch total visits
        if (!hasIncrementedPageView) {
          hasIncrementedPageView = true;
          await supabase.rpc("increment_page_view");
        }
        const { data: analyticsData } = await supabase
          .from("analytics")
          .select("total_visits")
          .limit(1)
          .single();

        if (isMounted && analyticsData) {
          setTotalVisits(analyticsData.total_visits);
        }

        // 2. Setup Realtime Presence for Live Users
        const channelName = "global_room";
        const existingChannel = supabase.getChannels().find(c => c.topic === `realtime:${channelName}`);
        if (existingChannel) {
          await supabase.removeChannel(existingChannel);
        }

        roomOne = supabase.channel(channelName, {
          config: {
            presence: {
              key: "user_" + Math.random().toString(36).substring(7),
            },
          },
        });

        roomOne
          .on("presence", { event: "sync" }, () => {
            const newState = roomOne.presenceState();
            const count = Object.keys(newState).length;
            if (isMounted) setLiveUsers(count > 0 ? count : 1);
          })
          .subscribe(async (status) => {
            if (status === "SUBSCRIBED") {
              await roomOne.track({
                online_at: new Date().toISOString(),
              });
            }
          });

      } catch (error) {
        console.error("Error setting up stats:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    setupStats();

    return () => {
      isMounted = false;
      if (roomOne) {
        supabase?.removeChannel(roomOne);
      }
    };
  }, []);

  if (isLoading) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
      className="inline-flex items-center gap-2 text-sm font-medium text-secondary whitespace-nowrap"
    >
      <div className="flex items-center gap-1.5">
        <div className="relative flex items-center justify-center w-2 h-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-75 animate-ping"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent"></span>
        </div>
        <span>{liveUsers} {liveUsers === 1 ? "user" : "users"} live</span>
      </div>
      <div className="w-px h-3 bg-border"></div>
      <div className="flex items-center gap-1.5">
        <Eye className="w-3.5 h-3.5 text-secondary/70" />
        <span>{totalVisits.toLocaleString()} total visits</span>
      </div>
    </motion.div>
  );
}
