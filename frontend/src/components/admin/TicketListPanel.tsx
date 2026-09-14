"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Pagination } from "@/components/admin/Pagination";
import { TicketFilters } from "@/components/admin/TicketFilters";
import { TicketTable } from "@/components/admin/TicketTable";
import { IconTrash } from "@/components/ui/icons";
import type { useTicketList } from "@/hooks/useTicketList";

export function TicketListPanel({ list }: { list: ReturnType<typeof useTicketList> }) {
  const searchParams = useSearchParams();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Selection is scoped to the current page/filter view — reset whenever
  // that view actually changes (not on every list.tickets update, which
  // also fires for in-place quick-edits and would otherwise wipe a live
  // selection out from under the user).
  const searchParamsKey = searchParams.toString();
  useEffect(() => {
    setSelectedIds(new Set());
  }, [searchParamsKey]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const allSelected = list.tickets.length > 0 && list.tickets.every((t) => prev.has(t.id));
      return allSelected ? new Set() : new Set(list.tickets.map((t) => t.id));
    });
  };

  const handleDeleteSelected = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    const label = ids.length === 1 ? "this ticket" : `these ${ids.length} tickets`;
    if (!window.confirm(`Delete ${label}? This can't be undone.`)) return;

    setDeleting(true);
    setDeleteError(null);
    try {
      await list.deleteSelected(ids);
      console.info("[TicketListPanel] deleted tickets", { count: ids.length });
      setSelectedIds(new Set());
    } catch (error) {
      console.error("[TicketListPanel] failed to delete tickets", { ids, error });
      setDeleteError("Couldn't delete the selected tickets. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <TicketFilters total={list.total} showing={list.matchingCount} />

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 shadow-[var(--shadow)]">
          <span className="text-sm font-medium text-[var(--ink)]">{selectedIds.size} selected</span>
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="btn-focus text-xs font-semibold text-[var(--muted)] hover:underline"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={handleDeleteSelected}
            disabled={deleting}
            className="btn-focus ml-auto flex items-center gap-1.5 rounded-lg bg-[var(--err)] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
          >
            <IconTrash />
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      )}

      {deleteError && <p className="text-xs text-[var(--err)]">{deleteError}</p>}

      {list.status === "loading" && (
        <p className="text-sm text-[var(--muted)]">Loading tickets…</p>
      )}

      {list.status === "error" && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-7 text-center shadow-[var(--shadow)]">
          <p className="mb-4 text-sm text-[var(--muted)]">Couldn&apos;t load tickets.</p>
          <button
            type="button"
            onClick={list.refetch}
            className="btn-focus rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-ink)]"
          >
            Retry
          </button>
        </div>
      )}

      {list.status === "ready" && list.tickets.length === 0 && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-10 text-center shadow-[var(--shadow)]">
          <p className="text-sm font-medium text-[var(--ink)]">No tickets match your filters.</p>
        </div>
      )}

      {list.status === "ready" && list.tickets.length > 0 && (
        <>
          <TicketTable
            tickets={list.tickets}
            onUpdate={list.patchTicket}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
          />
          <Pagination count={list.matchingCount} />
        </>
      )}
    </div>
  );
}
