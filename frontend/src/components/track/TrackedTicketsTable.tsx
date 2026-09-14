"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PriorityBadge } from "@/components/ticket-status/PriorityBadge";
import { StatusBadge } from "@/components/ticket-status/StatusBadge";
import { formatShortDate } from "@/lib/format";
import type { Ticket } from "@/lib/types/ticket";

export function TrackedTicketsTable({ tickets }: { tickets: Ticket[] }) {
  const router = useRouter();

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">
      <div className="overflow-x-auto">
        <table className="admin-table w-full min-w-[560px]">
          <thead>
            <tr>
              <th>Ticket</th>
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
                onClick={() => router.push(`/tickets/${t.token}`)}
              >
                <td className="max-w-[320px]">
                  <Link
                    href={`/tickets/${t.token}`}
                    onClick={(e) => e.stopPropagation()}
                    className="btn-focus block truncate text-sm font-medium text-[var(--ink)] hover:underline"
                  >
                    {t.title}
                  </Link>
                  <p className="font-mono truncate text-[0.7rem] text-[var(--muted)]">{t.token}</p>
                </td>
                <td>
                  <PriorityBadge priority={t.priority} />
                </td>
                <td>
                  <StatusBadge status={t.status} />
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
