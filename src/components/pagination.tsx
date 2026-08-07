import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  page,
  totalPages,
  buildHref,
}: {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
  );

  return (
    <nav className="mt-10 flex items-center justify-center gap-1.5" aria-label="Paginación">
      <Link
        href={buildHref(Math.max(1, page - 1))}
        aria-disabled={page === 1}
        className={`flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 ${
          page === 1 ? "pointer-events-none opacity-40" : ""
        }`}
      >
        <ChevronLeft className="h-4 w-4" />
      </Link>

      {pages.map((p, i) => (
        <span key={p} className="flex items-center gap-1.5">
          {i > 0 && pages[i - 1] !== p - 1 && <span className="px-1 text-gray-400">...</span>}
          <Link
            href={buildHref(p)}
            className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium ${
              p === page ? "bg-brand-blue text-white" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            {p}
          </Link>
        </span>
      ))}

      <Link
        href={buildHref(Math.min(totalPages, page + 1))}
        aria-disabled={page === totalPages}
        className={`flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 ${
          page === totalPages ? "pointer-events-none opacity-40" : ""
        }`}
      >
        <ChevronRight className="h-4 w-4" />
      </Link>
    </nav>
  );
}
