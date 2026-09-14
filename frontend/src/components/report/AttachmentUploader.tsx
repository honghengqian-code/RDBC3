"use client";

import { useRef, useState } from "react";
import { IconClip, IconUpload, IconX } from "@/components/ui/icons";
import { formatBytes } from "@/lib/format";

export interface AttachedFile {
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

export function AttachmentUploader({
  files,
  onChange,
}: {
  files: AttachedFile[];
  onChange: (files: AttachedFile[]) => void;
}) {
  const [dragActive, setDragActive] = useState(false);
  const [fileError, setFileError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

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
    onChange(next);
    setFileError(err);
  };

  const removeFile = (id: string) => onChange(files.filter((f) => f.id !== id));

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[var(--ink)]">
        Attachments <span className="font-normal text-[var(--muted)]">(optional)</span>
      </label>
      <div
        role="button"
        tabIndex={0}
        data-active={dragActive}
        className="dropzone btn-focus cursor-pointer px-4 py-6 text-center"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
        }}
      >
        <div
          className="flex flex-col items-center gap-1.5"
          style={{ color: dragActive ? "var(--accent)" : "var(--muted)" }}
        >
          <IconUpload />
          <p className="text-sm text-[var(--ink)]">
            Drag files here, or <span className="text-[var(--accent)] underline">browse</span>
          </p>
          <p className="text-xs">
            PNG, JPG, PDF, TXT, or LOG · up to 5MB each · {MAX_FILES} files max
          </p>
        </div>
        <input
          ref={inputRef}
          id="attachments"
          type="file"
          multiple
          className="sr-only"
          accept={ALLOWED_EXT.join(",")}
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
      {fileError && <p className="mt-2 text-xs text-[var(--err)]">{fileError}</p>}
      {files.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2">
          {files.map(({ id, file }) => (
            <li
              key={id}
              className="flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm"
            >
              <span className="text-[var(--muted)]">
                <IconClip />
              </span>
              <span className="flex-1 truncate text-[var(--ink)]">{file.name}</span>
              <span className="text-xs tabular-nums text-[var(--muted)]">
                {formatBytes(file.size)}
              </span>
              <button
                type="button"
                aria-label={`Remove ${file.name}`}
                className="btn-focus rounded p-1 text-[var(--muted)]"
                onClick={() => removeFile(id)}
              >
                <IconX />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
