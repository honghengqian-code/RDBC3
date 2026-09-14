"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { listTickets, updateTicket, type UpdateTicketPatch } from "@/lib/api/admin";
import type { Ticket } from "@/lib/types/ticket";

type ListState = { status: "loading" } | { status: "error" } | { status: "ready"; tickets: Ticket[] };

export function useTicketList() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<ListState>({ status: "loading" });

  const statusFilter = searchParams.get("status") ?? "All";
  const priorityFilter = searchParams.get("priority") ?? "All";
  const search = searchParams.get("search") ?? "";

  const load = useCallback(async () => {
    try {
      const tickets = await listTickets();
      console.info("[useTicketList] loaded", { count: tickets.length });
      setState({ status: "ready", tickets });
    } catch (error) {
      console.error("[useTicketList] failed to load tickets", error);
      setState({ status: "error" });
    }
  }, []);

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
  const filtered = tickets.filter((t) => {
    if (statusFilter !== "All" && t.status !== statusFilter) return false;
    if (priorityFilter !== "All" && t.priority !== priorityFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const haystack = `${t.title} ${t.clientName} ${t.clientEmail}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  return {
    status: state.status,
    tickets: filtered,
    total: tickets.length,
    patchTicket,
    refetch: load,
  };
}
