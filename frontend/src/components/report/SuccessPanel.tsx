"use client";

import { useState } from "react";
import { IconCheck, IconCopy } from "@/components/ui/icons";

export function SuccessPanel({
  email,
  link,
  onReset,
}: {
  email: string;
  link: string;
  onReset: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — link is still visible to copy manually.
    }
  };

  return (
    <section
      className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 text-center shadow-[var(--shadow)] sm:p-7"
    >
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--ok-soft)] text-[var(--ok)]">
        <IconCheck />
      </div>
      <h1 className="font-display mb-1.5 text-[1.5rem] font-extrabold text-[var(--ink)] sm:text-[1.7rem]">
        Ticket submitted
      </h1>
      <p className="mx-auto mb-6 max-w-sm text-sm text-[var(--muted)]">
        We emailed a confirmation to <span className="text-[var(--ink)]">{email}</span>. Use the
        link below anytime to check its status — bookmark it, you won&apos;t be asked to log in.
      </p>

      <div className="mb-5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-4 text-left">
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
          Trackable link
        </p>
        <div className="flex items-center gap-2">
          <code className="font-mono min-w-0 flex-1 truncate rounded-md border border-[var(--border)] bg-[var(--surface)] px-2.5 py-2 text-xs text-[var(--ink)]">
            {link}
          </code>
          <button
            type="button"
            onClick={copyLink}
            className="btn-focus inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold"
            style={{
              background: copied ? "var(--ok-soft)" : "var(--accent-soft)",
              color: copied ? "var(--ok)" : "var(--accent)",
            }}
          >
            <IconCopy /> {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      <div className="flex flex-col justify-center gap-2 sm:flex-row">
        <a
          href={link}
          onClick={(e) => e.preventDefault()}
          className="btn-focus rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--accent-ink)]"
        >
          Open ticket status page
        </a>
        <button
          type="button"
          onClick={onReset}
          className="btn-focus rounded-lg border border-[var(--border-strong)] px-4 py-2.5 text-sm font-semibold text-[var(--ink)]"
        >
          Submit another report
        </button>
      </div>
    </section>
  );
}
