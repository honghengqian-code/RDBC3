"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnalyticsPanel } from "@/components/admin/AnalyticsPanel";
import { DashboardTabs, type DashboardTab } from "@/components/admin/DashboardTabs";
import { TicketListPanel } from "@/components/admin/TicketListPanel";
import { useTicketList } from "@/hooks/useTicketList";

export function AdminDashboardView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab: DashboardTab = searchParams.get("tab") === "analytics" ? "analytics" : "list";
  const list = useTicketList();

  const setTab = (next: DashboardTab) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "list") params.delete("tab");
    else params.set("tab", next);
    router.push(`${pathname}${params.toString() ? `?${params}` : ""}`);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-[1.5rem] font-extrabold leading-tight text-[var(--ink)] sm:text-[1.75rem]">
          Ticket dashboard
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Triage incoming reports and track how the team is doing.
        </p>
      </div>

      <DashboardTabs active={tab} onChange={setTab} ticketCount={list.total} />

      <div role="tabpanel">
        {tab === "list" ? (
          <TicketListPanel list={list} />
        ) : (
          <AnalyticsPanel active={tab === "analytics"} />
        )}
      </div>
    </div>
  );
}
