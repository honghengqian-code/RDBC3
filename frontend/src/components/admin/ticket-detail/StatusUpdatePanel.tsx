"use client";

import { useState } from "react";
import { IconCheck, IconSpinner } from "@/components/ui/icons";
import { STATUS_ORDER } from "@/lib/ticket-meta";
import type { TicketStatus } from "@/lib/types/ticket";

export function StatusUpdatePanel({
  status,
  onUpdate,
}: {
  status: TicketStatus;
  onUpdate: (status: TicketStatus) => Promise<void>;
}) {
  const [draft, setDraft] = useState<TicketStatus>(status);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const dirty = draft !== status;

  const apply = async () => {
    setSaving(true);
    try {
      await onUpdate(draft);
      setJustSaved(true);
      window.setTimeout(() => setJustSaved(false), 1600);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <label htmlFor="status-select" className="mb-1.5 block text-xs font-semibold text-[var(--muted)]">
        Status
      </label>
      <select
        id="status-select"
        value={draft}
        onChange={(e) => setDraft(e.target.value as TicketStatus)}
        className="field-input mb-2"
      >
        {STATUS_ORDER.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={apply}
        disabled={!dirty || saving}
        className="btn-focus flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold disabled:opacity-50"
        style={{
          background: justSaved ? "var(--ok-soft)" : "var(--accent)",
          color: justSaved ? "var(--ok)" : "var(--accent-ink)",
        }}
      >
        {saving ? (
          <IconSpinner />
        ) : justSaved ? (
          <IconCheck width={14} height={14} strokeWidth={2.4} />
        ) : null}
        {saving ? "Updating…" : justSaved ? "Status updated" : "Update status"}
      </button>
      <p className="mt-2 text-[0.7rem] text-[var(--muted)]">
        Changing status emails the client automatically.
      </p>
    </div>
  );
}
