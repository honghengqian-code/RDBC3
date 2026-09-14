"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PriorityQuickEdit, StatusQuickEdit } from "@/components/admin/QuickEditControls";
import { formatShortDate } from "@/lib/format";
import type { Ticket, TicketPriority, TicketStatus } from "@/lib/types/ticket";
import type { UpdateTicketPatch } from "@/lib/api/admin";

function SelectAllCheckbox({
  checked,
  indeterminate,
  onChange,
}: {
  checked: boolean;
  indeterminate: boolean;
  onChange: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      aria-label="Select all tickets on this page"
      className="h-4 w-4 accent-[var(--accent)]"
    />
  );
}

export function TicketTable({
  tickets,
  onUpdate,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
}: {
  tickets: Ticket[];
  onUpdate: (id: string, patch: UpdateTicketPatch) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
}) {
  const router = useRouter();
  const allSelected = tickets.length > 0 && tickets.every((t) => selectedIds.has(t.id));
  const someSelected = tickets.some((t) => selectedIds.has(t.id));

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">
      <div className="overflow-x-auto">
        <table className="admin-table w-full min-w-[720px]">
          <thead>
            <tr>
              <th className="w-10">
                <SelectAllCheckbox
                  checked={allSelected}
                  indeterminate={someSelected && !allSelected}
                  onChange={onToggleSelectAll}
                />
              </th>
              <th>Ticket</th>
              <th>Client</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Opened</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((t) => (
              <tr
                key={t.id}
                className="cursor-pointer"
                onClick={() => router.push(`/admin/tickets/${t.id}`)}
              >
                <td onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(t.id)}
                    onChange={() => onToggleSelect(t.id)}
                    aria-label={`Select ticket ${t.title}`}
                    className="h-4 w-4 accent-[var(--accent)]"
                  />
                </td>
                <td className="max-w-[280px]">
                  <Link
                    href={`/admin/tickets/${t.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="btn-focus block truncate text-sm font-medium text-[var(--ink)] hover:underline"
                  >
                    {t.title}
                  </Link>
                  <p className="font-mono truncate text-[0.7rem] text-[var(--muted)]">{t.token}</p>
                </td>
                <td className="max-w-[180px]">
                  <p className="truncate text-sm text-[var(--ink)]">{t.clientName}</p>
                  <p className="truncate text-xs text-[var(--muted)]">{t.clientEmail}</p>
                </td>
                <td>
                  <PriorityQuickEdit
                    priority={t.priority}
                    onChange={(priority: TicketPriority) => onUpdate(t.id, { priority })}
                  />
                </td>
                <td>
                  <StatusQuickEdit
                    status={t.status}
                    onChange={(status: TicketStatus) => onUpdate(t.id, { status })}
                  />
                </td>
                <td className="whitespace-nowrap text-sm text-[var(--muted)]">
                  {formatShortDate(t.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
