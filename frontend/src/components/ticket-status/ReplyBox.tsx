"use client";

import { useState } from "react";
import { addTicketResponse } from "@/lib/api/tickets";
import { IconSend, IconSpinner } from "@/components/ui/icons";
import type { TicketResponse } from "@/lib/types/ticket";

const REPLY_MAX = 2000;

export function ReplyBox({
  token,
  onSent,
}: {
  token: string;
  onSent: (response: TicketResponse) => void;
}) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setError(null);
    try {
      const response = await addTicketResponse(token, trimmed);
      console.info("[ReplyBox] reply sent", { token, responseId: response.id });
      onSent(response);
      setMessage("");
    } catch (err) {
      console.error("[ReplyBox] failed to send reply", { token, error: err });
      setError("Couldn't send your reply. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="border-t border-[var(--border)] pt-4">
      <label htmlFor="reply" className="mb-1.5 block text-sm font-medium text-[var(--ink)]">
        Reply to this ticket
      </label>
      <textarea
        id="reply"
        rows={3}
        maxLength={REPLY_MAX}
        placeholder="Add more detail, or ask a follow-up question…"
        className="field-input resize-y mb-2"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      {error && <p className="mb-2 text-xs text-[var(--err)]">{error}</p>}
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs tabular-nums text-[var(--muted)]">
          {message.length}/{REPLY_MAX}
        </span>
        <button
          type="submit"
          disabled={!message.trim() || sending}
          className="btn-focus inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-ink)] disabled:opacity-50"
        >
          {sending ? <IconSpinner /> : <IconSend />}
          {sending ? "Sending…" : "Send reply"}
        </button>
      </div>
    </form>
  );
}
