import { IconClip } from "@/components/ui/icons";
import type { TicketAttachment } from "@/lib/types/ticket";

/** Compact inline attachment chips for one message bubble — the full AttachmentsList
 * (with size + a bigger target) is for ticket-level attachments; a reply's files just
 * need to be visible and clickable without competing with the message text. */
export function ResponseAttachmentChips({ attachments }: { attachments: TicketAttachment[] }) {
  if (attachments.length === 0) return null;

  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {attachments.map((f) => (
        <a
          key={f.id}
          href={f.url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-focus inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-[0.7rem] font-medium text-[var(--ink)] hover:underline"
        >
          <IconClip width={11} height={11} /> {f.name}
        </a>
      ))}
    </div>
  );
}
