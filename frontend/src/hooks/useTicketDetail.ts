"use client";

import { useCallback, useEffect, useState } from "react";
import {
  addAdminResponse,
  getTicketDetail,
  updateTicket,
  type UpdateTicketPatch,
} from "@/lib/api/admin";
import type { Ticket, TicketResponse } from "@/lib/types/ticket";

type DetailState =
  | { status: "loading" }
  | { status: "not-found" }
  | { status: "error" }
  | { status: "ready"; ticket: Ticket; responses: TicketResponse[] };

export function useTicketDetail(id: string) {
  const [state, setState] = useState<DetailState>({ status: "loading" });

  const load = useCallback(async () => {
    try {
      const result = await getTicketDetail(id);
      if (!result) {
        console.warn("[useTicketDetail] no ticket found for id", { id });
        setState({ status: "not-found" });
        return;
      }
      console.info("[useTicketDetail] loaded", { id, status: result.ticket.status });
      setState({ status: "ready", ticket: result.ticket, responses: result.responses });
    } catch (error) {
      console.error("[useTicketDetail] failed to load ticket", { id, error });
      setState({ status: "error" });
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const patchTicket = useCallback(
    async (patch: UpdateTicketPatch) => {
      setState((prev) =>
        prev.status === "ready" ? { ...prev, ticket: { ...prev.ticket, ...patch } } : prev,
      );
      try {
        const updated = await updateTicket(id, patch);
        console.info("[useTicketDetail] ticket updated", { id, patch });
        setState((prev) => (prev.status === "ready" ? { ...prev, ticket: updated } : prev));
      } catch (error) {
        console.error("[useTicketDetail] failed to update ticket, reloading", { id, error });
        await load();
      }
    },
    [id, load],
  );

  const sendReply = useCallback(
    async (message: string, notifyClient: boolean) => {
      const response = await addAdminResponse(id, { message, notifyClient });
      console.info("[useTicketDetail] reply sent", { id, responseId: response.id, notifyClient });
      setState((prev) =>
        prev.status === "ready" ? { ...prev, responses: [...prev.responses, response] } : prev,
      );
    },
    [id],
  );

  return { ...state, refetch: load, patchTicket, sendReply };
}
