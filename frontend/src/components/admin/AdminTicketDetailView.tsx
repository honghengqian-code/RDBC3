"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { AdminReplyForm } from "@/components/admin/ticket-detail/AdminReplyForm";
import { ClientDetailsCard } from "@/components/admin/ticket-detail/ClientDetailsCard";
import { MessageThread } from "@/components/admin/ticket-detail/MessageThread";
import { PrioritySelect } from "@/components/admin/ticket-detail/PrioritySelect";
import { StatusUpdatePanel } from "@/components/admin/ticket-detail/StatusUpdatePanel";
import { AttachmentsList } from "@/components/ticket-status/AttachmentsList";
import { PriorityBadge } from "@/components/ticket-status/PriorityBadge";
import { StatusBadge } from "@/components/ticket-status/StatusBadge";
import { IconArrowLeft } from "@/components/ui/icons";
import { useTicketDetail } from "@/hooks/useTicketDetail";

function Panel({ children }: { children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-7 text-center shadow-[var(--shadow)]">
      {children}
    </section>
  );
}

export function AdminTicketDetailView({ id }: { id: string }) {
  const state = useTicketDetail(id);

  if (state.status === "loading") {
    return (
      <Panel>
        <p className="text-sm text-[var(--muted)]">Loading ticket…</p>
      </Panel>
    );
  }

  if (state.status === "not-found") {
    return (
      <Panel>
        <h1 className="font-display mb-2 text-xl font-extrabold text-[var(--ink)]">
          Ticket not found
        </h1>
        <p className="mb-5 text-sm text-[var(--muted)]">No ticket exists for id &quot;{id}&quot;.</p>
        <Link
          href="/admin/dashboard"
          className="btn-focus inline-flex items-center justify-center rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--accent-ink)]"
        >
          Back to Dashboard
        </Link>
      </Panel>
    );
  }

  if (state.status === "error") {
    return (
      <Panel>
        <p className="mb-4 text-sm text-[var(--muted)]">Couldn&apos;t load this ticket.</p>
        <button
          type="button"
          onClick={state.refetch}
          className="btn-focus rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--accent-ink)]"
        >
          Retry
        </button>
      </Panel>
    );
  }

  const { ticket, responses } = state;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link
          href="/admin/dashboard"
          className="btn-focus mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--muted)]"
        >
          <IconArrowLeft /> Back to Dashboard
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono mb-1 text-xs text-[var(--muted)]">Ticket #{ticket.id}</p>
            <h1 className="font-display text-xl font-extrabold leading-tight text-[var(--ink)] sm:text-2xl">
              {ticket.title}
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-5">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]">
            <h2 className="font-display mb-4 text-sm font-bold uppercase tracking-wide text-[var(--ink)]">
              Description
            </h2>
            <p className="rounded-lg bg-[var(--surface-2)] p-4 text-sm leading-relaxed text-[var(--ink)]">
              {ticket.description}
            </p>
            <AttachmentsList attachments={ticket.attachments} />
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]">
            <h2 className="font-display mb-4 text-sm font-bold uppercase tracking-wide text-[var(--ink)]">
              Responses ({responses.length})
            </h2>
            <MessageThread responses={responses} />
            <AdminReplyForm clientName={ticket.clientName} onSend={state.sendReply} />
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]">
            <h2 className="font-display mb-5 text-sm font-bold uppercase tracking-wide text-[var(--ink)]">
              Quick actions
            </h2>
            <div className="flex flex-col gap-5">
              <StatusUpdatePanel
                status={ticket.status}
                onUpdate={(status) => state.patchTicket({ status })}
              />
              <PrioritySelect
                priority={ticket.priority}
                onChange={(priority) => state.patchTicket({ priority })}
              />
            </div>
          </div>
          <ClientDetailsCard ticket={ticket} />
        </div>
      </div>
    </div>
  );
}
