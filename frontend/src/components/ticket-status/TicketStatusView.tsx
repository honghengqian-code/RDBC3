"use client";

import { useState } from "react";
import Link from "next/link";
import { useTicket } from "@/hooks/useTicket";
import { PriorityBadge } from "@/components/ticket-status/PriorityBadge";
import { ReplyBox } from "@/components/ticket-status/ReplyBox";
import { ResponseThread } from "@/components/ticket-status/ResponseThread";
import { StatusBadge } from "@/components/ticket-status/StatusBadge";
import { TicketTimeline } from "@/components/ticket-status/TicketTimeline";
import { IconCopy } from "@/components/ui/icons";
import { formatDateTime } from "@/lib/format";

const TICKET_DOMAIN = "https://helpdesk.example.com";

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-7 text-center shadow-[var(--shadow)]">
      {children}
    </section>
  );
}

function LoadingPanel() {
  return (
    <Panel>
      <p className="text-sm text-[var(--muted)]">Loading your ticket…</p>
    </Panel>
  );
}

function NotFoundPanel({ token }: { token: string }) {
  return (
    <Panel>
      <h1 className="font-display mb-2 text-xl font-extrabold text-[var(--ink)]">
        Ticket not found
      </h1>
      <p className="mb-1 text-sm text-[var(--muted)]">
        We couldn&apos;t find a ticket for this link. Double-check the URL from your confirmation
        email.
      </p>
      <p className="font-mono mb-5 truncate text-xs text-[var(--muted)]">{token}</p>
      <Link
        href="/"
        className="btn-focus inline-flex items-center justify-center rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--accent-ink)]"
      >
        Back to home
      </Link>
    </Panel>
  );
}

function ErrorPanel({ onRetry }: { onRetry: () => void }) {
  return (
    <Panel>
      <h1 className="font-display mb-2 text-xl font-extrabold text-[var(--ink)]">
        Something went wrong
      </h1>
      <p className="mb-5 text-sm text-[var(--muted)]">
        We couldn&apos;t load this ticket. Please try again.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="btn-focus rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--accent-ink)]"
      >
        Retry
      </button>
    </Panel>
  );
}

export function TicketStatusView({ token }: { token: string }) {
  const state = useTicket(token);
  const [copied, setCopied] = useState(false);

  if (state.status === "loading") return <LoadingPanel />;
  if (state.status === "not-found") return <NotFoundPanel token={token} />;
  if (state.status === "error") return <ErrorPanel onRetry={state.refetch} />;

  const { ticket, responses } = state;
  const ticketLink = `${TICKET_DOMAIN}/tickets/${ticket.token}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(ticketLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch (error) {
      console.error("[TicketStatusView] failed to copy link", error);
    }
  };

  return (
    <>
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)] sm:p-7">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent)]">
            Ticket status · token access
          </p>
          <button
            type="button"
            onClick={copyLink}
            className="btn-focus inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold"
            style={{
              background: copied ? "var(--ok-soft)" : "var(--surface-2)",
              color: copied ? "var(--ok)" : "var(--muted)",
            }}
          >
            <IconCopy /> {copied ? "Link copied" : "Copy link"}
          </button>
        </div>

        <h1 className="font-display mb-3 text-[1.5rem] font-extrabold leading-tight text-[var(--ink)] sm:text-[1.75rem]">
          {ticket.title}
        </h1>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
          <span className="text-xs text-[var(--muted)]">
            Opened {formatDateTime(ticket.createdAt)} by {ticket.clientName}
          </span>
        </div>

        <p className="rounded-lg bg-[var(--surface-2)] p-4 text-sm leading-relaxed text-[var(--ink)]">
          {ticket.description}
        </p>

        <p className="font-mono mt-4 truncate text-[0.7rem] text-[var(--muted)]">
          token · {ticket.token}
        </p>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)] sm:p-7">
        <h2 className="font-display mb-5 text-sm font-bold uppercase tracking-wide text-[var(--ink)]">
          Progress
        </h2>
        <TicketTimeline ticket={ticket} />
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)] sm:p-7">
        <div className="mb-5 flex items-baseline justify-between">
          <h2 className="font-display text-sm font-bold uppercase tracking-wide text-[var(--ink)]">
            Responses
          </h2>
          <span className="text-xs text-[var(--muted)]">
            {responses.length} message{responses.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="mb-6">
          <ResponseThread responses={responses} />
        </div>
        <ReplyBox token={token} onSent={state.appendResponse} />
      </section>

      <p className="text-center text-xs text-[var(--muted)]">
        This page is only accessible via your unique ticket link — bookmark it to check back
        anytime.
      </p>
    </>
  );
}
