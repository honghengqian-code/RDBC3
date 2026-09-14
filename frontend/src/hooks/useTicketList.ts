"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { deleteTickets, listTickets, updateTicket, type UpdateTicketPatch } from "@/lib/api/admin";
import type { Ticket } from "@/lib/types/ticket";

type ListState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; tickets: Ticket[]; matchingCount: number; grandTotal: number };

export function useTicketList() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<ListState>({ status: "loading" });

  const statusFilter = searchParams.get("status") ?? "All";
  const priorityFilter = searchParams.get("priority") ?? "All";
  const search = searchParams.get("search") ?? "";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const hasFilter = statusFilter !== "All" || priorityFilter !== "All" || search !== "";

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      // The current page always comes from the server's real count for the active
      // filter; the grand (unfiltered) total is only worth a second request when a
      // filter is actually narrowing things — see CLAUDE.md 2.2's "Showing X of Y".
      const [current, grand] = await Promise.all([
        listTickets({ status: statusFilter, priority: priorityFilter, search, page }),
        hasFilter ? listTickets({ page: 1 }) : Promise.resolve(null),
      ]);
      console.info("[useTicketList] loaded", {
        pageRows: current.tickets.length,
        matchingCount: current.count,
        statusFilter,
        priorityFilter,
        search,
        page,
      });
      setState({
        status: "ready",
        tickets: current.tickets,
        matchingCount: current.count,
        grandTotal: hasFilter && grand ? grand.count : current.count,
      });
    } catch (error) {
      console.error("[useTicketList] failed to load tickets", error);
      setState({ status: "error" });
    }
  }, [statusFilter, priorityFilter, search, page, hasFilter]);

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

  const deleteSelected = useCallback(
    async (ids: string[]) => {
      if (ids.length === 0) return;
      try {
        const deleted = await deleteTickets(ids);
        console.info("[useTicketList] tickets deleted", { count: deleted });
        if (deleted !== ids.length) {
          // Not an error — someone else may have deleted one first — but
          // worth knowing about if counts are ever off.
          console.warn("[useTicketList] delete count mismatch", { requested: ids.length, deleted });
        }
      } catch (error) {
        console.error("[useTicketList] failed to delete tickets", { ids, error });
        throw error;
      } finally {
        // Deleting can change which page even exists (e.g. emptying the last
        // page), so re-fetch from the server rather than patch local state.
        await load();
      }
    },
    [load],
  );

  const tickets = state.status === "ready" ? state.tickets : [];
  const total = state.status === "ready" ? state.grandTotal : 0;
  const matchingCount = state.status === "ready" ? state.matchingCount : 0;

  return {
    status: state.status,
    tickets,
    total,
    matchingCount,
    page,
    patchTicket,
    deleteSelected,
    refetch: load,
  };
}
