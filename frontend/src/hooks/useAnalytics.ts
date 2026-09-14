"use client";

import { useCallback, useEffect, useState } from "react";
import { getAnalyticsSummary } from "@/lib/api/analytics";
import type { AnalyticsSummary } from "@/lib/types/analytics";

type AnalyticsState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; summary: AnalyticsSummary };

/** Fetches the analytics summary once each time `active` becomes true (i.e. per tab activation). */
export function useAnalytics(active: boolean) {
  const [state, setState] = useState<AnalyticsState>({ status: "loading" });

  const load = useCallback(async () => {
    try {
      const summary = await getAnalyticsSummary();
      console.info("[useAnalytics] summary loaded", { totalTickets: summary.totalTickets });
      setState({ status: "ready", summary });
    } catch (error) {
      console.error("[useAnalytics] failed to load summary", error);
      setState({ status: "error" });
    }
  }, []);

  useEffect(() => {
    if (active) load();
  }, [active, load]);

  return { ...state, refetch: load };
}
