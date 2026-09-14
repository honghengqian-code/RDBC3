"use client";

import { MetricCard } from "@/components/analytics/MetricCard";
import { ResolutionVelocityChart } from "@/components/analytics/ResolutionVelocityChart";
import { StatusDistributionChart } from "@/components/analytics/StatusDistributionChart";
import { useAnalytics } from "@/hooks/useAnalytics";
import { formatDuration } from "@/lib/format";

export function AnalyticsPanel({ active }: { active: boolean }) {
  const state = useAnalytics(active);

  if (state.status === "loading") {
    return <p className="text-sm text-[var(--muted)]">Loading analytics…</p>;
  }

  if (state.status === "error") {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-7 text-center shadow-[var(--shadow)]">
        <p className="mb-4 text-sm text-[var(--muted)]">Couldn&apos;t load analytics.</p>
        <button
          type="button"
          onClick={state.refetch}
          className="btn-focus rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-ink)]"
        >
          Retry
        </button>
      </div>
    );
  }

  const { summary } = state;
  const openPct = summary.totalTickets
    ? Math.round((summary.openCount / summary.totalTickets) * 100)
    : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard label="Total tickets" value={summary.totalTickets} sub="All time" />
        <MetricCard
          label="Avg. resolution time"
          value={summary.avgResolutionHours !== null ? formatDuration(summary.avgResolutionHours) : "—"}
          sub={`Across ${summary.closedCount} resolved ticket${summary.closedCount === 1 ? "" : "s"}`}
        />
        <MetricCard
          label="Open vs. closed"
          value={`${summary.openCount} : ${summary.closedCount}`}
          sub={`${openPct}% currently open`}
        >
          <div className="mt-2 flex h-2 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
            <div style={{ width: `${openPct}%`, background: "var(--accent)" }} />
            <div style={{ width: `${100 - openPct}%`, background: "var(--ok)" }} />
          </div>
        </MetricCard>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <StatusDistributionChart data={summary.byStatus} />
        <ResolutionVelocityChart data={summary.resolutionVelocity} />
      </div>
    </div>
  );
}
