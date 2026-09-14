"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PriorityQuickEdit, StatusQuickEdit } from "@/components/admin/QuickEditControls";
import { formatShortDate } from "@/lib/format";
import type { Ticket, TicketPriority, TicketStatus } from "@/lib/types/ticket";
import type { UpdateTicketPatch } from "@/lib/api/admin";

export function TicketTable({
  tickets,
  onUpdate,
}: {
  tickets: Ticket[];
  onUpdate: (id: string, patch: UpdateTicketPatch) => void;
}) {
  const router = useRouter();

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">
      <div className="overflow-x-auto">
        <table className="admin-table w-full min-w-[720px]">
          <thead>
            <tr>
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
