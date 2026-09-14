import { BarChart } from "@/components/analytics/BarChart";
import type { ResolutionPoint } from "@/lib/types/analytics";

export function ResolutionVelocityChart({ data }: { data: ResolutionPoint[] }) {
  return (
    <BarChart
      title="Resolution velocity (days to close)"
      data={data.map((d) => ({ label: d.label, value: d.days, color: "var(--accent)" }))}
      valueSuffix="d"
    />
  );
}
