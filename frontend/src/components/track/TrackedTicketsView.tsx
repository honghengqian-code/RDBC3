"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TrackedTicketsTable } from "@/components/track/TrackedTicketsTable";
import { getTrackedTickets } from "@/lib/api/tickets";
import type { Ticket } from "@/lib/types/ticket";

type ViewState =
  | { status: "loading" }
  | { status: "invalid" }
  | { status: "ready"; email: string; tickets: Ticket[] };

export function TrackedTicketsView({ verifyToken }: { verifyToken: string }) {
  const [state, setState] = useState<ViewState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await getTrackedTickets(verifyToken);
        if (cancelled) return;
        if (!result) {
          console.warn("[TrackedTicketsView] verification link invalid or expired", { verifyToken });
          setState({ status: "invalid" });
          return;
        }
        console.info("[TrackedTicketsView] loaded", {
          email: result.email,
          count: result.tickets.length,
        });
        setState({ status: "ready", email: result.email, tickets: result.tickets });
      } catch (error) {
        console.error("[TrackedTicketsView] failed to load tracked tickets", error);
        if (!cancelled) setState({ status: "invalid" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [verifyToken]);

  if (state.status === "loading") {
    return (
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-7 text-center shadow-[var(--shadow)]">
        <p className="text-sm text-[var(--muted)]">Loading your tickets…</p>
      </section>
    );
  }

  if (state.status === "invalid") {
    return (
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-7 text-center shadow-[var(--shadow)]">
        <h1 className="font-display mb-2 text-xl font-extrabold text-[var(--ink)]">
          Link expired
        </h1>
        <p className="mb-5 text-sm text-[var(--muted)]">
          This tracking link is invalid or has expired — links last 15 minutes.
        </p>
        <Link
          href="/track"
          className="btn-focus inline-flex items-center justify-center rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--accent-ink)]"
        >
          Request a new link
        </Link>
      </section>
    );
  }

  const { email, tickets } = state;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent)]">
          Verified · {email}
        </p>
        <h1 className="font-display mt-1 text-[1.5rem] font-extrabold leading-tight text-[var(--ink)] sm:text-[1.75rem]">
          Your tickets
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {tickets.length} ticket{tickets.length === 1 ? "" : "s"} filed under this email. Click
          one to see its full status and reply.
        </p>
      </div>
      {tickets.length === 0 ? (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-10 text-center shadow-[var(--shadow)]">
          <p className="text-sm text-[var(--ink)]">No tickets found for this email.</p>
        </section>
      ) : (
        <TrackedTicketsTable tickets={tickets} />
      )}
    </div>
  );
}
