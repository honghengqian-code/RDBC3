import Link from "next/link";
import { IconMark } from "@/components/ui/icons";
import { NAV_LINKS } from "@/lib/nav-links";

export function NavBar() {
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3.5 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span
            aria-hidden="true"
            className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]"
          >
            <IconMark />
          </span>
          <span className="font-display text-[0.95rem] font-bold tracking-tight text-[var(--ink)]">
            Incident Desk
          </span>
        </Link>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="btn-focus rounded text-sm font-medium text-[var(--muted)]"
            >
              {l.label}
            </Link>
          ))}
          <span aria-hidden="true" className="h-4 w-px bg-[var(--border)]" />
          <Link
            href="/admin/login"
            className="btn-focus rounded text-xs font-medium text-[var(--muted)]"
          >
            Admin Login
          </Link>
        </nav>
      </div>
    </header>
  );
}
