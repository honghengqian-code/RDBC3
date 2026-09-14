import { BarChart } from "@/components/analytics/BarChart";
import { STATUS_META } from "@/lib/ticket-meta";
import type { StatusCount } from "@/lib/types/analytics";

export function StatusDistributionChart({ data }: { data: StatusCount[] }) {
  return (
    <BarChart
      title="Tickets by status"
      data={data.map((d) => ({ label: d.status, value: d.count, color: STATUS_META[d.status].color }))}
    />
  );
}
