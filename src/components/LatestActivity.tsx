import { getProductLogoUrl, handleLogoError } from "@/lib/logo";
import { productPath } from "@/lib/product-path";
import type { Product } from "@/types";

function timeAgo(dateString?: string) {
  if (!dateString) return "";
  const diffInSeconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (diffInSeconds < 60) return "just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  return `${Math.floor(diffInHours / 24)}d ago`;
}

export default function LatestActivity({
  items,
  layout = "strip",
  onOpen,
}: {
  items: Product[];
  layout?: "strip" | "stack";
  onOpen: (item: Product) => void;
}) {
  if (items.length === 0) return null;

  return (
    <div className={layout === "stack" ? "mb-8" : "my-3 px-1"}>
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-accent-dark mb-1.5">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-70" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
        </span>
        Latest activity
      </p>
      <div className={layout === "stack" ? "flex flex-col gap-2.5" : "grid grid-cols-3 gap-2 md:gap-4"}>
        {items.map((activity) => (
          <a
            key={activity.id}
            href={productPath(activity)}
            onClick={() => onOpen(activity)}
            onAuxClick={(e) => {
              if (e.button === 1) onOpen(activity);
            }}
            className="group/act min-w-0 flex items-center gap-1.5"
          >
            <div className={`relative shrink-0 rounded overflow-hidden bg-muted ${layout === "stack" ? "w-8 h-8" : "w-6 h-6"}`}>
              {activity.url ? (
                <img
                  src={getProductLogoUrl(activity)}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover bg-white"
                  onError={(e) => handleLogoError(e.currentTarget, activity.url)}
                />
              ) : (
                <img src="/globe.svg" alt="" className="w-3 h-3 m-auto mt-1.5 opacity-40" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] md:text-[13px] font-semibold tracking-tight text-foreground truncate group-hover/act:text-accent transition-colors">
                {activity.name}
              </p>
              <p className="text-[11px] text-secondary truncate">
                at #{activity.rank} · ${activity.price.toLocaleString()} · {timeAgo(activity.last_hopped_at || activity.created_at)}
              </p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
