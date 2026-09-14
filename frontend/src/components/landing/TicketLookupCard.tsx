"use client";

import { useState } from "react";
import Link from "next/link";
import { ActionCard } from "@/components/landing/ActionCard";
import { IconArrowRight, IconSearch } from "@/components/ui/icons";

const EXAMPLE_TOKEN = "d4a1f2b6-9c3a";

type LookupState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "token"; link: string }
  | { status: "email"; email: string }
  | { status: "invalid"; message: string };

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
function isTokenLike(value: string) {
  return /^[0-9a-f]{6,}(-[0-9a-f]{2,}){1,4}$/i.test(value);
}

export function TicketLookupCard() {
  const [value, setValue] = useState("");
  const [state, setState] = useState<LookupState>({ status: "idle" });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = value.trim();
    if (!v) {
      setState({ status: "invalid", message: "Enter your email or ticket ID." });
      return;
    }
    setState({ status: "checking" });
    // Stands in for POST /api/public/tickets/lookup/ until the backend exists.
    window.setTimeout(() => {
      if (isTokenLike(v)) {
        console.info("[TicketLookupCard] resolved as token", { link: `/tickets/${v}` });
        setState({ status: "token", link: `/tickets/${v}` });
      } else if (isEmail(v)) {
        console.info("[TicketLookupCard] resolved as email lookup");
        setState({ status: "email", email: v });
      } else {
        console.warn("[TicketLookupCard] input matched neither a token nor an email");
        setState({
          status: "invalid",
          message: "That doesn't look like an email or a ticket ID — check for typos.",
        });
      }
    }, 500);
  };

  return (
    <ActionCard icon={<IconSearch />} eyebrow="Already have a ticket?" title="Track your ticket">
      <p className="mb-4 text-sm text-[var(--muted)]">
        Enter the email you filed with, or paste your ticket ID from the confirmation email.
      </p>
      <form onSubmit={onSubmit} className="flex flex-col gap-2.5">
        <label htmlFor="lookup" className="sr-only">
          Email or ticket ID
        </label>
        <input
          id="lookup"
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (state.status !== "idle") setState({ status: "idle" });
          }}
          placeholder={`you@example.com or ${EXAMPLE_TOKEN}…`}
          className="field-input"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={state.status === "checking"}
          className="btn-focus inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--accent)] py-2.5 text-sm font-semibold text-[var(--accent-ink)] disabled:opacity-70"
        >
          {state.status === "checking" ? (
            <svg className="animate-spin" viewBox="0 0 24 24" width="14" height="14" fill="none">
              <circle
                cx="12"
                cy="12"
                r="9"
                stroke="currentColor"
                strokeOpacity=".3"
                strokeWidth="3"
              />
              <path
                d="M21 12a9 9 0 0 0-9-9"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <IconArrowRight />
          )}
          {state.status === "checking" ? "Looking that up…" : "Find my ticket"}
        </button>
      </form>

      {state.status === "invalid" && (
        <p className="mt-3 text-xs text-[var(--err)]">{state.message}</p>
      )}
      {state.status === "token" && (
        <Link
          href={state.link}
          className="btn-focus mt-3 flex items-center justify-between rounded-lg bg-[var(--ok-soft)] px-3.5 py-2.5 text-sm font-medium text-[var(--ok)]"
        >
          Continue to your ticket <IconArrowRight />
        </Link>
      )}
      {state.status === "email" && (
        <p className="mt-3 rounded-lg bg-[var(--surface-2)] px-3.5 py-2.5 text-xs text-[var(--muted)]">
          If <span className="font-medium text-[var(--ink)]">{state.email}</span> has any open
          tickets, we&apos;ve emailed tracking links to that inbox.
        </p>
      )}
    </ActionCard>
  );
}
