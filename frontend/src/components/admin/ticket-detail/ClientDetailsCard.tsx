"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { IconCheck, IconCopy } from "@/components/ui/icons";
import { formatDateTime } from "@/lib/format";
import type { Ticket } from "@/lib/types/ticket";

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-[var(--border)] py-2.5 first:pt-0 last:border-b-0 last:pb-0">
      <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-[var(--muted)]">
        {label}
      </span>
      {children}
    </div>
  );
}

export function ClientDetailsCard({ ticket }: { ticket: Ticket }) {
  const [copied, setCopied] = useState(false);

  const copyToken = async () => {
    try {
      await navigator.clipboard.writeText(ticket.token);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error("[ClientDetailsCard] failed to copy token", error);
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]">
      <h2 className="font-display mb-4 text-sm font-bold uppercase tracking-wide text-[var(--ink)]">
        Client details
      </h2>
      <DetailRow label="Name">
        <span className="text-sm font-medium text-[var(--ink)]">{ticket.clientName}</span>
      </DetailRow>
      <DetailRow label="Email">
        <span className="text-sm text-[var(--ink)]">{ticket.clientEmail}</span>
      </DetailRow>
      <DetailRow label="Token ID">
        <div className="flex items-center gap-2">
          <code className="font-mono min-w-0 flex-1 truncate text-xs text-[var(--ink)]">
            {ticket.token}
          </code>
          <button
            type="button"
            onClick={copyToken}
            className="btn-focus shrink-0 rounded p-1"
            style={{ color: copied ? "var(--ok)" : "var(--muted)" }}
            aria-label="Copy token"
          >
            {copied ? <IconCheck width={14} height={14} strokeWidth={2.4} /> : <IconCopy />}
          </button>
        </div>
      </DetailRow>
      <DetailRow label="Created">
        <span className="text-sm text-[var(--ink)]">{formatDateTime(ticket.createdAt)}</span>
      </DetailRow>
    </div>
  );
}
