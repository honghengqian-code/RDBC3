import { apiFetch } from "@/lib/api/client";
import type { AnalyticsSummary } from "@/lib/types/analytics";

// GET /api/admin/analytics/summary/ — the backend already emits this exact camelCase shape.
export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const data = await apiFetch<AnalyticsSummary>("/api/admin/analytics/summary/");
  if (!data) throw new Error("Analytics summary returned no data.");
  return data;
}
