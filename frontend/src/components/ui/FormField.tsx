import type { ReactNode } from "react";

export function FormField({
  id,
  label,
  required,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-[var(--ink)]">
          {label} {required && <span className="text-[var(--accent)]">*</span>}
        </label>
        {hint && <span className="text-xs text-[var(--muted)]">{hint}</span>}
      </div>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-[var(--err)]">
          {error}
        </p>
      )}
    </div>
  );
}
