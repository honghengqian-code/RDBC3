"use client";

export type DashboardTab = "list" | "analytics";

export function DashboardTabs({
  active,
  onChange,
  ticketCount,
}: {
  active: DashboardTab;
  onChange: (tab: DashboardTab) => void;
  ticketCount: number;
}) {
  return (
    <div
      role="tablist"
      aria-label="Dashboard views"
      className="flex items-center gap-6 border-b border-[var(--border)]"
    >
      <button
        role="tab"
        aria-selected={active === "list"}
        className="tab-btn btn-focus"
        onClick={() => onChange("list")}
      >
        Ticket List <span className="tabular-nums text-[var(--muted)]">({ticketCount})</span>
      </button>
      <button
        role="tab"
        aria-selected={active === "analytics"}
        className="tab-btn btn-focus"
        onClick={() => onChange("analytics")}
      >
        Analytics
      </button>
    </div>
  );
}
