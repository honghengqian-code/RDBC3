"use client";

import { useCallback, useEffect, useState } from "react";
import { getTicketByToken } from "@/lib/api/tickets";
import type { Ticket, TicketResponse } from "@/lib/types/ticket";

const POLL_INTERVAL_MS = 30000;

type TicketState =
  | { status: "loading" }
  | { status: "not-found" }
  | { status: "error" }
  | { status: "ready"; ticket: Ticket; responses: TicketResponse[] };

export function useTicket(token: string) {
  const [state, setState] = useState<TicketState>({ status: "loading" });

  const load = useCallback(async () => {
    try {
      const result = await getTicketByToken(token);
      if (!result) {
        console.warn("[useTicket] no ticket found for token", { token });
        setState({ status: "not-found" });
        return;
      }
      console.info("[useTicket] ticket loaded", { token, status: result.ticket.status });
      setState({ status: "ready", ticket: result.ticket, responses: result.responses });
    } catch (error) {
      console.error("[useTicket] failed to load ticket", { token, error });
      setState({ status: "error" });
    }
  }, [token]);

  useEffect(() => {
    load();
    const interval = window.setInterval(load, POLL_INTERVAL_MS);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);

  const appendResponse = useCallback((response: TicketResponse) => {
    setState((prev) =>
      prev.status === "ready" ? { ...prev, responses: [...prev.responses, response] } : prev,
    );
  }, []);

  return { ...state, refetch: load, appendResponse };
}
