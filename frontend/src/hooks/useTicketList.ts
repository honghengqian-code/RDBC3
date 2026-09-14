"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { listTickets, updateTicket, type UpdateTicketPatch } from "@/lib/api/admin";
import type { Ticket } from "@/lib/types/ticket";

type ListState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; tickets: Ticket[]; grandTotal: number };

export function useTicketList() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<ListState>({ status: "loading" });

  const statusFilter = searchParams.get("status") ?? "All";
  const priorityFilter = searchParams.get("priority") ?? "All";
  const search = searchParams.get("search") ?? "";
  const hasFilter = statusFilter !== "All" || priorityFilter !== "All" || search !== "";

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      // Fetch the filtered set and, only when a filter is active, the grand
      // total too — that's what "Showing X of Y" (CLAUDE.md 2.2) needs; the
      // unfiltered call is skipped when there's nothing to compare against.
      const [tickets, grandTotal] = await Promise.all([
        listTickets({ status: statusFilter, priority: priorityFilter, search }),
        hasFilter ? listTickets({}).then((all) => all.length) : Promise.resolve(-1),
      ]);
      console.info("[useTicketList] loaded", { count: tickets.length, statusFilter, priorityFilter, search });
      setState({ status: "ready", tickets, grandTotal: hasFilter ? grandTotal : tickets.length });
    } catch (error) {
      console.error("[useTicketList] failed to load tickets", error);
      setState({ status: "error" });
    }
  }, [statusFilter, priorityFilter, search, hasFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const patchTicket = useCallback(
    async (id: string, patch: UpdateTicketPatch) => {
      setState((prev) =>
        prev.status === "ready"
          ? { ...prev, tickets: prev.tickets.map((t) => (t.id === id ? { ...t, ...patch } : t)) }
          : prev,
      );
      try {
        const updated = await updateTicket(id, patch);
        console.info("[useTicketList] ticket updated", { id, patch });
        setState((prev) =>
          prev.status === "ready"
            ? { ...prev, tickets: prev.tickets.map((t) => (t.id === id ? updated : t)) }
            : prev,
        );
      } catch (error) {
        console.error("[useTicketList] failed to update ticket, rolling back", { id, error });
        await load();
      }
    },
    [load],
  );

  const tickets = state.status === "ready" ? state.tickets : [];
  const total = state.status === "ready" ? state.grandTotal : tickets.length;

  return {
    status: state.status,
    tickets,
    total,
    patchTicket,
    refetch: load,
  };
}
