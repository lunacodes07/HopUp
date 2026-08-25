"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, CheckCircle2, XCircle, Globe, Image as ImageIcon } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type MetaData = {
  domain: string;
  url: string;
  finalTitle: string;
  finalDescription: string;
  finalImage: string | null;
  finalCard: string;
  rawTags: Record<string, string | null>;
};

export default function TwitterCardValidator() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MetaData | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setIsLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch("/api/tools/parse-meta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to fetch metadata");
      }

      setData(json.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const isLargeImage = data?.finalCard === "summary_large_image";

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-accent/30">
      <Navbar />
      
      <main className="flex-1 flex flex-col pt-32 pb-24 px-4 md:px-8 max-w-5xl mx-auto w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-semibold mb-6">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>
            Free Developer Tools by HopUp
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
            Twitter/X Card Validator
          </h1>
          <p className="text-secondary text-lg max-w-2xl mx-auto">
            Preview how your links appear when shared on X. Check Open Graph tags, twitter:card meta tags, and image sizes instantly.
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="relative w-full max-w-2xl mx-auto mb-16">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Globe className="h-5 w-5 text-secondary" />
          </div>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://yourwebsite.com"
            required
            className="block w-full pl-12 pr-32 py-4 bg-white border border-border/50 rounded-2xl shadow-sm text-lg focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="absolute right-2 top-2 bottom-2 px-6 bg-foreground text-background font-semibold rounded-xl hover:bg-foreground/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin"></div>
            ) : (
              "Preview"
            )}
          </button>
        </form>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 max-w-2xl mx-auto w-full mb-12 flex items-center gap-3"
            >
              <XCircle className="w-5 h-5 flex-shrink-0" />
              <p className="font-medium text-sm">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        {data && (
          <div className="flex flex-col md:flex-row gap-8 lg:gap-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* The Twitter Preview Component */}
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                Card Preview
              </h2>
              <div className="bg-white p-6 md:p-8 rounded-3xl border border-border/50 shadow-sm">
                
                {/* Simulated Twitter Post Container */}
                <div className="max-w-[500px] mx-auto flex gap-3">
                  {/* Fake Avatar */}
                  <div className="w-10 h-10 rounded-full bg-muted flex-shrink-0 mt-1"></div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="font-bold text-[15px] hover:underline cursor-pointer">You</span>
                      <span className="text-secondary text-[15px]">@founder · 1m</span>
                    </div>
                    <p className="text-[15px] mb-3">Check out my new project! 🚀</p>
                    
                    {/* The Actual Link Card */}
                    <div 
                      className={`block overflow-hidden border border-border/70 hover:bg-muted/30 transition-colors cursor-pointer rounded-2xl ${
                        !isLargeImage ? 'flex items-stretch h-[130px]' : 'flex flex-col'
                      }`}
                    >
                      {/* Image Area */}
                      <div className={`${isLargeImage ? 'w-full aspect-[1.91/1] border-b border-border/70' : 'w-[130px] border-r border-border/70 flex-shrink-0'} bg-muted/50 relative overflow-hidden flex items-center justify-center`}>
                        {data.finalImage ? (
                          <img 
                            src={data.finalImage} 
                            alt="Card image" 
                            className="absolute inset-0 w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-secondary/40" />
                        )}
                      </div>

                      {/* Text Area */}
                      <div className={`flex flex-col justify-center p-3 ${isLargeImage ? '' : 'flex-1 min-w-0'}`}>
                        {data.domain && (
                          <div className="text-[13px] text-secondary truncate mb-0.5">
                            {data.domain}
                          </div>
                        )}
                        {data.finalTitle && (
                          <div className="text-[15px] font-bold text-foreground leading-tight truncate">
                            {data.finalTitle}
                          </div>
                        )}
                        {data.finalDescription && (
                          <div className="text-[15px] text-secondary leading-tight truncate mt-0.5 max-w-full">
                            {data.finalDescription}
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            </div>

            {/* Meta Tags Debugger */}
            <div className="w-full md:w-[350px] flex-shrink-0">
              <h2 className="text-xl font-bold mb-4">Meta Tags</h2>
              <div className="bg-white rounded-3xl border border-border/50 shadow-sm overflow-hidden text-sm">
                
                <div className="p-4 bg-muted/30 border-b border-border/50 flex items-center justify-between font-semibold">
                  <span>Detected Card Type</span>
                  <span className="px-2 py-1 bg-accent/10 text-accent rounded-md text-xs">{data.finalCard}</span>
                </div>

                <div className="p-4 flex flex-col gap-3">
                  {[
                    { key: "twitter:card", val: data.rawTags.twitterCard, label: "Twitter Card" },
                    { key: "twitter:title", val: data.rawTags.twitterTitle, label: "Twitter Title" },
                    { key: "twitter:description", val: data.rawTags.twitterDescription, label: "Twitter Desc" },
                    { key: "twitter:image", val: data.rawTags.twitterImage, label: "Twitter Image" },
                    { key: "og:title", val: data.rawTags.ogTitle, label: "OG Title" },
                    { key: "og:description", val: data.rawTags.ogDescription, label: "OG Desc" },
                    { key: "og:image", val: data.rawTags.ogImage, label: "OG Image" },
                  ].map((tag, idx) => (
                    <div key={idx} className="flex items-start gap-2.5">
                      {tag.val ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 mt-0.5 flex-shrink-0 flex items-center justify-center"></div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-foreground/90">{tag.key}</div>
                        {tag.val ? (
                          <div className="text-xs text-secondary truncate mt-0.5" title={tag.val}>{tag.val}</div>
                        ) : (
                          <div className="text-xs text-secondary/50 mt-0.5">Missing</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </div>

          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
