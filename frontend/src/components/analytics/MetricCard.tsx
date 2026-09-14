import type { ReactNode } from "react";

export function MetricCard({
  label,
  value,
  sub,
  children,
}: {
  label: string;
  value: string | number;
  sub?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]">
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">{label}</p>
      <p className="font-display text-[1.9rem] font-extrabold leading-tight tabular-nums text-[var(--ink)]">
        {value}
      </p>
      {sub && <p className="text-xs text-[var(--muted)]">{sub}</p>}
      {children}
    </div>
  );
}
