"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconArrowRight, IconSpinner } from "@/components/ui/icons";
import { requestTrackingLink } from "@/lib/api/tickets";

const EXAMPLE_TOKEN = "d4a1f2b6-9c3a";

type EntryState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "sent"; email: string }
  | { status: "invalid"; message: string };

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isTokenLike(value: string): boolean {
  return /^[0-9a-f]{6,}(-[0-9a-f]{2,}){1,4}$/i.test(value);
}

/** Accepts a bare token, a full ticket URL, or a relative "/tickets/<token>" path. */
function extractToken(value: string): string | null {
  try {
    const url = new URL(value, window.location.origin);
    const match = url.pathname.match(/\/tickets\/([^/]+)\/?$/);
    if (match) return decodeURIComponent(match[1]);
  } catch {
    // Not URL-parseable — fall through to bare-token matching below.
  }
  return isTokenLike(value) ? value : null;
}

export function TrackEntryForm() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [state, setState] = useState<EntryState>({ status: "idle" });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = value.trim();
    if (!v) {
      setState({ status: "invalid", message: "Enter your email, ticket ID, or ticket link." });
      return;
    }

    const token = extractToken(v);
    if (token) {
      console.info("[TrackEntryForm] resolved as token, navigating", { token });
      router.push(`/tickets/${token}`);
      return;
    }

    if (!isEmail(v)) {
      setState({
        status: "invalid",
        message: "That doesn't look like an email, ticket ID, or ticket link — check for typos.",
      });
      return;
    }

    setState({ status: "checking" });
    try {
      await requestTrackingLink(v);
      console.info("[TrackEntryForm] tracking link requested", { email: v });
      setState({ status: "sent", email: v });
    } catch (error) {
      console.error("[TrackEntryForm] failed to request tracking link", error);
      setState({ status: "invalid", message: "Something went wrong. Please try again." });
    }
  };

  if (state.status === "sent") {
    return (
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center shadow-[var(--shadow)] sm:p-8">
        <h1 className="font-display mb-2 text-xl font-extrabold text-[var(--ink)]">
          Check your email
        </h1>
        <p className="text-sm text-[var(--muted)]">
          If <span className="font-medium text-[var(--ink)]">{state.email}</span> has any
          tickets, we&apos;ve sent a link to view them — it&apos;s valid for 15 minutes.
        </p>
        {process.env.NODE_ENV !== "production" && (
          <div className="mt-5 rounded-lg border border-dashed border-[var(--border-strong)] bg-[var(--surface-2)] p-4 text-left">
            <p className="text-xs text-[var(--muted)]">
              <span className="font-semibold uppercase tracking-wide">Dev note</span> — no SMTP
              configured yet, so the link was printed to the Django backend&apos;s console output
              (the email backend defaults to <span className="font-mono">console</span> in dev).
            </p>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)] sm:p-8">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent)]">
        Find your tickets
      </p>
      <h1 className="font-display mb-1.5 text-[1.4rem] font-extrabold text-[var(--ink)]">
        Track your ticket
      </h1>
      <p className="mb-6 text-sm text-[var(--muted)]">
        Enter the email you filed with to see all of your tickets, or paste a ticket ID or link
        to jump straight to it.
      </p>
      <form onSubmit={onSubmit} className="flex flex-col gap-2.5">
        <label htmlFor="track-input" className="sr-only">
          Email, ticket ID, or ticket link
        </label>
        <input
          id="track-input"
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (state.status !== "idle") setState({ status: "idle" });
          }}
          placeholder={`you@example.com, a ticket ID, or ${EXAMPLE_TOKEN}…`}
          className="field-input"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={state.status === "checking"}
          className="btn-focus inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--accent)] py-2.5 text-sm font-semibold text-[var(--accent-ink)] disabled:opacity-70"
        >
          {state.status === "checking" ? <IconSpinner /> : <IconArrowRight />}
          {state.status === "checking" ? "Looking that up…" : "Find my tickets"}
        </button>
      </form>
      {state.status === "invalid" && (
        <p className="mt-3 text-xs text-[var(--err)]">{state.message}</p>
      )}
    </section>
  );
}
