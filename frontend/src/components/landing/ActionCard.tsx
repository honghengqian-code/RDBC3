import type { ReactNode } from "react";

export function ActionCard({
  icon,
  eyebrow,
  title,
  children,
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="lift flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)] sm:p-7">
      <span
        aria-hidden="true"
        className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]"
      >
        {icon}
      </span>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--accent)]">
        {eyebrow}
      </p>
      <h3 className="font-display mb-2 text-xl font-extrabold text-[var(--ink)]">{title}</h3>
      {children}
    </div>
  );
}
