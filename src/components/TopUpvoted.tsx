import { getProductLogoUrl, handleLogoError } from "@/lib/logo";
import { productPath } from "@/lib/product-path";
import type { Product } from "@/types";
import UpvoteButton from "./UpvoteButton";

export default function TopUpvoted({
  items,
  voted,
  championId,
  onOpen,
  onVoted,
  layout = "stack",
  className,
}: {
  items: Product[];
  voted: Set<string>;
  championId?: string | null;
  onOpen: (item: Product) => void;
  onVoted: (productId: string, nextCount: number) => void;
  layout?: "strip" | "stack";
  className?: string;
}) {
  if (items.length === 0) return null;

  const strip = layout === "strip";

  return (
    <div className={className ?? (strip ? "my-3 px-1" : "mb-8")}>
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/80 mb-1.5">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-grape" />
        Most upvoted
      </p>
      <ol className={strip ? "grid grid-cols-3 gap-2 md:gap-4" : "flex flex-col"}>
        {items.map((item, index) => (
          <li key={item.id} className={strip ? "min-w-0" : "border-b border-border/50 last:border-b-0"}>
            <a
              href={productPath(item)}
              onClick={() => onOpen(item)}
              onAuxClick={(e) => {
                if (e.button === 1) onOpen(item);
              }}
              className={`group flex items-center min-w-0 ${strip ? "gap-1.5" : "gap-2.5 py-2.5"}`}
            >
              {!strip && (
                <span className="w-5 shrink-0 text-[12px] font-semibold tabular-nums text-secondary">
                  {index + 1}
                </span>
              )}
              <div className={`relative shrink-0 overflow-hidden rounded bg-muted ${strip ? "h-6 w-6" : "h-8 w-8 rounded-lg border border-border/40"}`}>
                {item.url ? (
                  <img
                    src={getProductLogoUrl(item)}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover bg-white"
                    onError={(e) => handleLogoError(e.currentTarget, item.url)}
                  />
                ) : (
                  <img src="/globe.svg" alt="" className={`m-auto opacity-40 ${strip ? "mt-1.5 h-3 w-3" : "mt-2 h-3.5 w-3.5"}`} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`font-semibold tracking-tight text-foreground truncate group-hover:text-accent transition-colors ${strip ? "text-[12px] md:text-[13px]" : "text-[13px]"}`}>
                  {item.name}
                </p>
                <p className="text-[11px] text-secondary truncate">
                  {item.id === championId ? "HOF" : `#${item.rank}`} · ${item.price.toLocaleString()}
                  {strip ? ` · ${item.upvotes || 0}` : ""}
                </p>
              </div>
              {!strip && (
                <UpvoteButton
                  productId={item.id}
                  count={item.upvotes || 0}
                  voted={voted.has(item.id)}
                  onVoted={onVoted}
                />
              )}
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
}
