"use client";

import { IconChevron } from "@/components/ui/icons";
import { PRIORITY_META, PRIORITY_ORDER } from "@/lib/ticket-meta";
import type { TicketPriority } from "@/lib/types/ticket";

export function PrioritySelect({
  priority,
  onChange,
}: {
  priority: TicketPriority;
  onChange: (priority: TicketPriority) => void;
}) {
  const meta = PRIORITY_META[priority];
  return (
    <div>
      <label
        htmlFor="priority-select"
        className="mb-1.5 block text-xs font-semibold text-[var(--muted)]"
      >
        Priority
      </label>
      <span className="relative flex w-full">
        <select
          id="priority-select"
          value={priority}
          onChange={(e) => onChange(e.target.value as TicketPriority)}
          className="pill-select btn-focus w-full text-left"
          style={{ background: meta.soft, color: meta.color }}
        >
          {PRIORITY_ORDER.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <IconChevron
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2"
          style={{ color: meta.color }}
        />
      </span>
      <p className="mt-2 text-[0.7rem] text-[var(--muted)]">
        Applies immediately, no client notification.
      </p>
    </div>
  );
}
