import { Fragment } from "react";
import { IconCheck } from "@/components/ui/icons";
import { formatDateTime } from "@/lib/format";
import { STATUS_HELPER, STATUS_META, STATUS_ORDER } from "@/lib/ticket-meta";
import type { Ticket } from "@/lib/types/ticket";

export function TicketTimeline({ ticket }: { ticket: Ticket }) {
  const currentIndex = STATUS_ORDER.indexOf(ticket.status);

  return (
    <div>
      <div className="flex items-start">
        {STATUS_ORDER.map((s, i) => {
          const reached = i <= currentIndex;
          const current = i === currentIndex;
          const meta = STATUS_META[s];
          const at = ticket.statusHistory[s];
          return (
            <Fragment key={s}>
              <div className="flex flex-col items-center text-center" style={{ width: "5.5rem" }}>
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2"
                  style={{
                    borderColor: reached ? meta.color : "var(--border-strong)",
                    background: reached ? meta.soft : "var(--surface)",
                    color: meta.color,
                    boxShadow: current ? `0 0 0 3px ${meta.soft}` : "none",
                  }}
                >
                  {i < currentIndex ? (
                    <IconCheck width={13} height={13} strokeWidth={2.5} />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="block h-2 w-2 rounded-full"
                      style={{ background: reached ? meta.color : "var(--border-strong)" }}
                    />
                  )}
                </span>
                <span
                  className="mt-2 text-xs font-semibold"
                  style={{ color: reached ? "var(--ink)" : "var(--muted)" }}
                >
                  {s}
                </span>
                <span className="mt-0.5 text-[0.7rem] text-[var(--muted)]">
                  {at ? formatDateTime(at) : "Pending"}
                </span>
              </div>
              {i < STATUS_ORDER.length - 1 && (
                <div
                  className="mt-[13px] h-0.5 flex-1 rounded-full"
                  style={{ background: i < currentIndex ? "var(--accent)" : "var(--border)" }}
                />
              )}
            </Fragment>
          );
        })}
      </div>
      <p className="mt-4 text-center text-xs text-[var(--muted)] sm:text-left">
        {STATUS_HELPER[ticket.status]}
      </p>
    </div>
  );
}
