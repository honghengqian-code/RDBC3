interface BarDatum {
  label: string;
  value: number;
  color: string;
}

/** Shared low-level bar renderer behind StatusDistributionChart and ResolutionVelocityChart. */
export function BarChart({
  title,
  data,
  valueSuffix,
  height = 140,
}: {
  title: string;
  data: BarDatum[];
  valueSuffix?: string;
  height?: number;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]">
      <h3 className="font-display mb-5 text-sm font-bold uppercase tracking-wide text-[var(--ink)]">
        {title}
      </h3>
      <div className="flex items-end gap-4" style={{ height }}>
        {data.map((d) => {
          const pct = Math.max((d.value / max) * 100, 3);
          return (
            <div key={d.label} className="flex h-full flex-1 flex-col items-center justify-end">
              <span className="mb-1 text-xs font-semibold tabular-nums" style={{ color: d.color }}>
                {d.value}
                {valueSuffix ?? ""}
              </span>
              <div
                className="w-full rounded-t-md"
                style={{ height: `${pct}%`, background: d.color, minHeight: 4 }}
              />
              <span className="mt-2 text-center text-[0.7rem] leading-tight text-[var(--muted)]">
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
