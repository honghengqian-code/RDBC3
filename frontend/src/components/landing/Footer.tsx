import Link from "next/link";
import { IconMark } from "@/components/ui/icons";
import { NAV_LINKS } from "@/lib/nav-links";

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-4 px-4 py-8 sm:flex-row sm:items-center sm:px-6">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]"
          >
            <IconMark width={12} height={12} />
          </span>
          <span className="text-xs text-[var(--muted)]">
            &copy; 2026 Incident Desk — no account required, ever.
          </span>
        </div>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="btn-focus rounded text-xs font-medium text-[var(--muted)]"
            >
              {l.label}
            </Link>
          ))}
          <span aria-hidden="true" className="h-3 w-px bg-[var(--border)]" />
          <Link
            href="/admin/login"
            className="btn-focus rounded text-xs font-medium text-[var(--muted)]"
          >
            Admin Login
          </Link>
        </nav>
      </div>
    </footer>
  );
}
