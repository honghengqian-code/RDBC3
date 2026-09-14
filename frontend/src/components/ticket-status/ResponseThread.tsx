import { formatDateTime } from "@/lib/format";
import type { TicketResponse } from "@/lib/types/ticket";

function MessageBubble({ response }: { response: TicketResponse }) {
  const isClient = response.authorType === "Client";
  return (
    <div className={`flex gap-2.5 ${isClient ? "flex-row-reverse" : "flex-row"}`}>
      <span
        aria-hidden="true"
        className="font-display mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[0.7rem] font-bold"
        style={{
          background: isClient ? "var(--accent)" : "var(--admin-chip)",
          color: isClient ? "var(--accent-ink)" : "var(--admin-chip-ink)",
        }}
      >
        {isClient ? "You" : "SP"}
      </span>
      <div className={`flex max-w-[80%] flex-col ${isClient ? "items-end" : "items-start"}`}>
        <div className={`mb-1 flex items-baseline gap-2 ${isClient ? "flex-row-reverse" : "flex-row"}`}>
          <span className="text-xs font-semibold text-[var(--ink)]">
            {isClient ? "You" : response.author}
          </span>
          <span className="text-[0.7rem] text-[var(--muted)]">
            {formatDateTime(response.createdAt)}
          </span>
        </div>
        <div
          className="rounded-xl px-3.5 py-2.5 text-sm leading-relaxed text-[var(--ink)]"
          style={{
            background: isClient ? "var(--accent-soft)" : "var(--surface-2)",
            borderTopRightRadius: isClient ? 4 : undefined,
            borderTopLeftRadius: isClient ? undefined : 4,
          }}
        >
          {response.message}
        </div>
      </div>
    </div>
  );
}

export function ResponseThread({ responses }: { responses: TicketResponse[] }) {
  return (
    <div className="flex flex-col gap-4">
      {responses.map((r) => (
        <MessageBubble key={r.id} response={r} />
      ))}
    </div>
  );
}
