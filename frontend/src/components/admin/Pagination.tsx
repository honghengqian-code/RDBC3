"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ADMIN_PAGE_SIZE } from "@/lib/api/admin";
import { IconArrowLeft, IconArrowRight } from "@/components/ui/icons";

/** count = tickets matching the current filter (server truth), not just this page's rows. */
export function Pagination({ count }: { count: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const totalPages = Math.max(1, Math.ceil(count / ADMIN_PAGE_SIZE));
  if (totalPages <= 1) return null;

  const goTo = (next: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next <= 1) params.delete("page");
    else params.set("page", String(next));
    router.push(`${pathname}${params.toString() ? `?${params}` : ""}`);
  };

  return (
    <div className="flex items-center justify-between gap-3 border-t border-[var(--border)] pt-3.5">
      <button
        type="button"
        onClick={() => goTo(page - 1)}
        disabled={page <= 1}
        className="btn-focus inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-[var(--ink)] disabled:opacity-40"
      >
        <IconArrowLeft /> Previous
      </button>
      <span className="text-xs tabular-nums text-[var(--muted)]">
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        onClick={() => goTo(page + 1)}
        disabled={page >= totalPages}
        className="btn-focus inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-[var(--ink)] disabled:opacity-40"
      >
        Next <IconArrowRight />
      </button>
    </div>
  );
}
