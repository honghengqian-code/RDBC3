"use client";

import { IconChevron } from "@/components/ui/icons";
import { PRIORITY_META, PRIORITY_ORDER, STATUS_META, STATUS_ORDER } from "@/lib/ticket-meta";
import type { TicketPriority, TicketStatus } from "@/lib/types/ticket";

function PillSelect<T extends string>({
  value,
  options,
  meta,
  label,
  onChange,
}: {
  value: T;
  options: readonly T[];
  meta: Record<T, { color: string; soft: string }>;
  label: string;
  onChange: (value: T) => void;
}) {
  const m = meta[value];
  return (
    <span
      className="relative inline-flex items-center"
      onClick={(e) => e.stopPropagation()}
    >
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="pill-select btn-focus"
        style={{ background: m.soft, color: m.color }}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <IconChevron className="pointer-events-none absolute right-1.5" style={{ color: m.color }} />
    </span>
  );
}

export function StatusQuickEdit({
  status,
  onChange,
}: {
  status: TicketStatus;
  onChange: (status: TicketStatus) => void;
}) {
  return (
    <PillSelect
      value={status}
      options={STATUS_ORDER}
      meta={STATUS_META}
      label="Status"
      onChange={onChange}
    />
  );
}

export function PriorityQuickEdit({
  priority,
  onChange,
}: {
  priority: TicketPriority;
  onChange: (priority: TicketPriority) => void;
}) {
  return (
    <PillSelect
      value={priority}
      options={PRIORITY_ORDER}
      meta={PRIORITY_META}
      label="Priority"
      onChange={onChange}
    />
  );
}
