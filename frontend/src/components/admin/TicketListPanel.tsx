"use client";

import { TicketFilters } from "@/components/admin/TicketFilters";
import { TicketTable } from "@/components/admin/TicketTable";
import type { useTicketList } from "@/hooks/useTicketList";

export function TicketListPanel({ list }: { list: ReturnType<typeof useTicketList> }) {
  return (
    <div className="flex flex-col gap-4">
      <TicketFilters total={list.total} showing={list.tickets.length} />

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
        <TicketTable tickets={list.tickets} onUpdate={list.patchTicket} />
      )}
    </div>
  );
}
