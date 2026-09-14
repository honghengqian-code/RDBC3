import { STATUS_META } from "@/lib/ticket-meta";
import type { TicketStatus } from "@/lib/types/ticket";

export function StatusBadge({ status }: { status: TicketStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ background: meta.soft, color: meta.color }}
    >
      <span
        aria-hidden="true"
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ background: meta.color }}
      />
      {status}
    </span>
  );
}
