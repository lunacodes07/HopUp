import Link from "next/link";
import { pageWindow } from "@/lib/pagination";

type PaginationProps = {
  current: number;
  total: number;
  hrefForPage: (page: number) => string;
};

const itemClass = (active: boolean) =>
  `w-7 h-7 flex items-center justify-center rounded-full text-[13px] font-medium transition-colors ${
    active ? "bg-foreground text-background" : "text-secondary hover:text-foreground"
  }`;

export default function Pagination({ current, total, hrefForPage }: PaginationProps) {
  if (total <= 1) return null;

  const pages = pageWindow(current, total);
  const prev = current > 1 ? current - 1 : null;
  const next = current < total ? current + 1 : null;

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1.5 mt-8">
      {prev ? (
        <Link
          href={hrefForPage(prev)}
          rel="prev"
          className="px-3 py-1.5 text-[13px] font-medium text-secondary hover:text-foreground transition-colors"
        >
          Previous
        </Link>
      ) : (
        <span className="px-3 py-1.5 text-[13px] font-medium text-secondary opacity-40">Previous</span>
      )}

      {pages.map((page, i) =>
        page === "ellipsis" ? (
          <span key={`e-${i}`} className="w-7 text-center text-[13px] text-secondary/60">
            …
          </span>
        ) : (
          <Link
            key={page}
            href={hrefForPage(page)}
            aria-current={page === current ? "page" : undefined}
            className={itemClass(page === current)}
          >
            {page}
          </Link>
        )
      )}

      {next ? (
        <Link
          href={hrefForPage(next)}
          rel="next"
          className="px-3 py-1.5 text-[13px] font-medium text-secondary hover:text-foreground transition-colors"
        >
          Next
        </Link>
      ) : (
        <span className="px-3 py-1.5 text-[13px] font-medium text-secondary opacity-40">Next</span>
      )}
    </nav>
  );
}
