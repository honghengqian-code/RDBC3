import { IconFile, IconImage } from "@/components/ui/icons";
import { formatBytes } from "@/lib/format";
import type { TicketAttachment } from "@/lib/types/ticket";

export function AttachmentsList({ attachments }: { attachments: TicketAttachment[] }) {
  if (attachments.length === 0) return null;

  return (
    <div className="mt-4">
      <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-wide text-[var(--muted)]">
        Attachments
      </p>
      <ul className="flex flex-col gap-2">
        {attachments.map((f) => (
          <li
            key={f.id}
            className="flex items-center gap-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5"
          >
            <span className="text-[var(--accent)]">
              {f.kind === "image" ? <IconImage /> : <IconFile />}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm text-[var(--ink)]">{f.name}</span>
            <span className="shrink-0 text-xs tabular-nums text-[var(--muted)]">
              {formatBytes(f.size)}
            </span>
            <a
              href={f.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-focus shrink-0 rounded px-2 py-1 text-xs font-semibold text-[var(--accent)]"
            >
              View
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
