"use client";

import { useRef, useState } from "react";
import { IconClip, IconFile, IconSend, IconSpinner, IconX } from "@/components/ui/icons";
import { formatBytes } from "@/lib/format";

interface AttachedFileMeta {
  id: string;
  file: File;
}

const MAX_FILES = 5;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXT = [".png", ".jpg", ".jpeg", ".gif", ".pdf", ".txt", ".log", ".csv"];

function extOf(name: string) {
  const i = name.lastIndexOf(".");
  return i === -1 ? "" : name.slice(i).toLowerCase();
}

export function AdminReplyForm({
  clientName,
  onSend,
}: {
  clientName: string;
  onSend: (message: string, notifyClient: boolean, files: File[]) => Promise<void>;
}) {
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<AttachedFileMeta[]>([]);
  const [notify, setNotify] = useState(true);
  const [sending, setSending] = useState(false);
  const [sentNote, setSentNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const addFiles = (list: FileList) => {
    const incoming = Array.from(list);
    let err = "";
    const next = [...files];
    for (const file of incoming) {
      if (next.length >= MAX_FILES) {
        err = `You can attach up to ${MAX_FILES} files.`;
        break;
      }
      if (file.size > MAX_FILE_BYTES) {
        err = `"${file.name}" is over the 5MB limit.`;
        continue;
      }
      if (!ALLOWED_EXT.includes(extOf(file.name))) {
        err = `"${file.name}" isn't a supported file type.`;
        continue;
      }
      next.push({ id: `${file.name}-${file.size}-${file.lastModified}`, file });
    }
    setFiles(next);
    setError(err || null);
  };
  const removeFile = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setError(null);
    try {
      await onSend(
        trimmed,
        notify,
        files.map((f) => f.file),
      );
      setSentNote(notify ? "Reply sent · client notified by email" : "Reply sent · client not notified");
      setMessage("");
      setFiles([]);
      window.setTimeout(() => setSentNote(""), 2200);
    } catch (err) {
      console.error("[AdminReplyForm] failed to send reply", err);
      setError("Couldn't send your reply. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-1 border-t border-[var(--border)] pt-4">
      <label htmlFor="admin-reply" className="mb-1.5 block text-sm font-medium text-[var(--ink)]">
        Reply to {clientName}
      </label>
      <textarea
        id="admin-reply"
        rows={4}
        maxLength={4000}
        placeholder="Write an update for the client…"
        className="field-input resize-y mb-3"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      {error && <p className="mb-3 text-xs text-[var(--err)]">{error}</p>}

      {files.length > 0 && (
        <ul className="mb-3 flex flex-wrap gap-2">
          {files.map((f) => (
            <li
              key={f.id}
              className="flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1 text-xs text-[var(--ink)]"
            >
              <IconFile width={13} height={13} /> {f.file.name}
              <span className="tabular-nums text-[var(--muted)]">{formatBytes(f.file.size)}</span>
              <button
                type="button"
                onClick={() => removeFile(f.id)}
                aria-label={`Remove ${f.file.name}`}
                className="text-[var(--muted)]"
              >
                <IconX />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="btn-focus inline-flex items-center gap-1.5 rounded-md bg-[var(--surface-2)] px-2.5 py-1.5 text-xs font-semibold text-[var(--muted)]"
          >
            <IconClip /> Attach files
          </button>
          <input
            ref={fileRef}
            type="file"
            multiple
            className="sr-only"
            accept={ALLOWED_EXT.join(",")}
            onChange={(e) => {
              if (e.target.files?.length) addFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-[var(--muted)]">
            <input
              type="checkbox"
              className="chk"
              checked={notify}
              onChange={(e) => setNotify(e.target.checked)}
            />
            Auto-notify client via email
          </label>
        </div>
        <button
          type="submit"
          disabled={!message.trim() || sending}
          className="btn-focus inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-ink)] disabled:opacity-50"
        >
          {sending ? <IconSpinner /> : <IconSend />}
          {sending ? "Sending…" : "Send reply"}
        </button>
      </div>
      {sentNote && <p className="mt-2 text-right text-xs text-[var(--ok)]">{sentNote}</p>}
    </form>
  );
}
