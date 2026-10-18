import { Button } from "@/components/ui/button";

interface TablePaginationProps {
  page: number;
  totalPages: number;
  rangeStart: number;
  rangeEnd: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}

/**
 * The page-number list is windowed around the current page (always showing
 * first/last) once there are more than 7 pages, with "…" gaps — at 400+
 * staff and a page size of 10 that's 40 pages, and rendering every single
 * page button would overflow the row. Below the threshold it just shows
 * every page, unchanged from before.
 */
function pageWindow(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages = new Set([
    1,
    2,
    total - 1,
    total,
    current - 1,
    current,
    current + 1,
  ]);
  const sorted = [...pages]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);
  const result: (number | "ellipsis")[] = [];
  let previous = 0;
  for (const p of sorted) {
    if (previous && p - previous > 1) {
      result.push("ellipsis");
    }
    result.push(p);
    previous = p;
  }
  return result;
}

/** The "Showing X to Y of Z entries" + Previous/numbered-pages/Next footer used under every paginated table in the app — kept in one place so the page-count windowing only needs fixing once. */
export function TablePagination({
  page,
  totalPages,
  rangeStart,
  rangeEnd,
  totalCount,
  onPageChange,
}: TablePaginationProps) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
      <p>
        Showing {rangeStart} to {rangeEnd} of {totalCount} entries
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          Previous
        </Button>
        {pageWindow(page, totalPages).map((entry, index) =>
          entry === "ellipsis" ? (
            <span key={`ellipsis-${index}`} className="px-1">
              …
            </span>
          ) : (
            <Button
              key={entry}
              variant={entry === page ? "default" : "outline"}
              size="sm"
              className="size-7 p-0"
              onClick={() => onPageChange(entry)}
            >
              {entry}
            </Button>
          ),
        )}
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
