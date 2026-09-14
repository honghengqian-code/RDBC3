import { formatDateTime } from "@/lib/format";
import type { TicketResponse } from "@/lib/types/ticket";

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function MessageBubble({ response }: { response: TicketResponse }) {
  const isSelf = response.authorType === "Admin";
  return (
    <div className={`flex gap-2.5 ${isSelf ? "flex-row-reverse" : "flex-row"}`}>
      <span
        aria-hidden="true"
        className="font-display mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[0.7rem] font-bold"
        style={{
          background: isSelf ? "var(--admin-chip)" : "var(--accent)",
          color: isSelf ? "var(--admin-chip-ink)" : "var(--accent-ink)",
        }}
      >
        {isSelf ? "You" : initials(response.author)}
      </span>
      <div className={`flex max-w-[82%] flex-col ${isSelf ? "items-end" : "items-start"}`}>
        <div className={`mb-1 flex items-center gap-2 ${isSelf ? "flex-row-reverse" : "flex-row"}`}>
          <span className="text-xs font-semibold text-[var(--ink)]">
            {isSelf ? "You" : response.author}
          </span>
          <span
            className="rounded-full px-1.5 py-0.5 text-[0.7rem] font-semibold"
            style={{
              background: isSelf ? "var(--admin-chip)" : "var(--accent)",
              color: isSelf ? "var(--admin-chip-ink)" : "var(--accent-ink)",
            }}
          >
            {response.authorType}
          </span>
          <span className="text-[0.7rem] text-[var(--muted)]">
            {formatDateTime(response.createdAt)}
          </span>
        </div>
        <div
          className="rounded-xl px-3.5 py-2.5 text-sm leading-relaxed text-[var(--ink)]"
          style={{
            background: isSelf ? "var(--accent-soft)" : "var(--surface-2)",
            borderTopRightRadius: isSelf ? 4 : undefined,
            borderTopLeftRadius: isSelf ? undefined : 4,
          }}
        >
          {response.message}
        </div>
      </div>
    </div>
  );
}

export function MessageThread({ responses }: { responses: TicketResponse[] }) {
  if (responses.length === 0) {
    return <p className="text-sm text-[var(--muted)]">No responses yet.</p>;
  }
  return (
    <div className="flex flex-col gap-4">
      {responses.map((r) => (
        <MessageBubble key={r.id} response={r} />
      ))}
    </div>
  );
}
