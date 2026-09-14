"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { IconSearch } from "@/components/ui/icons";
import { PRIORITY_ORDER, STATUS_ORDER } from "@/lib/ticket-meta";

export function TicketFilters({ total, showing }: { total: number; showing: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const status = searchParams.get("status") ?? "All";
  const priority = searchParams.get("priority") ?? "All";
  const search = searchParams.get("search") ?? "";
  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => setSearchInput(search), [search]);

  const updateParams = (next: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (!value || value === "All") params.delete(key);
      else params.set(key, value);
    }
    // Any filter change invalidates the current page — e.g. page 3 of an
    // unfiltered list may not exist once a filter narrows the result set.
    params.delete("page");
    router.push(`${pathname}${params.toString() ? `?${params}` : ""}`);
  };

  // Debounce free-text search so we're not pushing router state on every keystroke.
  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (searchInput !== search) updateParams({ search: searchInput || null });
    }, 300);
    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const hasActiveFilters = status !== "All" || priority !== "All" || search !== "";
  const clearFilters = () => {
    setSearchInput("");
    router.push(pathname);
  };

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <span className="relative">
        <IconSearch
          width={15}
          height={15}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)]"
        />
        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search title, name, or email…"
          className="field-input w-56 pl-8 sm:w-64"
        />
      </span>
      <select
        value={status}
        onChange={(e) => updateParams({ status: e.target.value })}
        className="field-input"
      >
        <option value="All">All statuses</option>
        {STATUS_ORDER.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <select
        value={priority}
        onChange={(e) => updateParams({ priority: e.target.value })}
        className="field-input"
      >
        <option value="All">All priorities</option>
        {PRIORITY_ORDER.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
      {hasActiveFilters && (
        <button
          type="button"
          onClick={clearFilters}
          className="btn-focus text-xs font-semibold text-[var(--accent)]"
        >
          Clear filters
        </button>
      )}
      <span className="ml-auto text-xs text-[var(--muted)]">
        Showing {showing} of {total} tickets
      </span>
    </div>
  );
}
