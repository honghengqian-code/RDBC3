import { formatShortDate } from "@/lib/format";
import { listAllTickets } from "@/lib/mock/ticket-store";
import { PRIORITY_ORDER, STATUS_ORDER } from "@/lib/ticket-meta";
import type { AnalyticsSummary } from "@/lib/types/analytics";

// Stands in for GET /api/admin/analytics/summary/ until the Django backend exists.
export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const tickets = listAllTickets();
  const totalTickets = tickets.length;

  const byStatus = STATUS_ORDER.map((status) => ({
    status,
    count: tickets.filter((t) => t.status === status).length,
  }));
  const byPriority = PRIORITY_ORDER.map((priority) => ({
    priority,
    count: tickets.filter((t) => t.priority === priority).length,
  }));

  const resolved = tickets.filter(
    (t): t is typeof t & { resolvedAt: string } => t.status === "Resolved" && t.resolvedAt !== null,
  );
  const closedCount = resolved.length;
  const openCount = totalTickets - closedCount;

  const avgResolutionHours = resolved.length
    ? resolved.reduce(
        (sum, t) => sum + (new Date(t.resolvedAt).getTime() - new Date(t.createdAt).getTime()) / 36e5,
        0,
      ) / resolved.length
    : null;

  const resolutionVelocity = resolved
    .slice()
    .sort((a, b) => new Date(a.resolvedAt).getTime() - new Date(b.resolvedAt).getTime())
    .map((t) => ({
      label: formatShortDate(t.resolvedAt),
      days:
        Math.round(
          ((new Date(t.resolvedAt).getTime() - new Date(t.createdAt).getTime()) / 36e5 / 24) * 10,
        ) / 10,
    }));

  return { totalTickets, openCount, closedCount, avgResolutionHours, byStatus, byPriority, resolutionVelocity };
}
