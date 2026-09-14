"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconMark } from "@/components/ui/icons";
import { adminLogout, type AdminSession } from "@/lib/api/auth";

export function AdminHeader({ session }: { session: AdminSession }) {
  const router = useRouter();
  const initials = session.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const logout = async () => {
    console.info("[AdminHeader] logging out", { email: session.email });
    try {
      await adminLogout();
    } catch (error) {
      console.error("[AdminHeader] logout request failed", error);
    }
    router.replace("/admin/login");
  };

  return (
    <header className="w-full border-b border-[var(--border)]">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]"
          >
            <IconMark />
          </span>
          <span className="font-display text-[0.95rem] font-bold tracking-tight text-[var(--ink)]">
            Incident Desk
          </span>
          <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-[var(--muted)]">
            Admin
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-[var(--muted)] sm:inline">
            Signed in as {session.name}
          </span>
          <span
            aria-hidden="true"
            className="font-display flex h-7 w-7 items-center justify-center rounded-full text-[0.7rem] font-bold"
            style={{ background: "var(--admin-chip)", color: "var(--admin-chip-ink)" }}
          >
            {initials}
          </span>
          <button
            type="button"
            onClick={logout}
            className="btn-focus text-xs font-medium text-[var(--muted)]"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
