import type { Metadata } from "next";
import Link from "next/link";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { IconMark } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Admin Sign In — Incident Desk",
  description: "Sign in to manage incoming tickets and track team performance.",
};

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">
      <header className="w-full border-b border-[var(--border)]">
        <div className="mx-auto flex w-full max-w-6xl items-center px-4 py-3.5 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
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
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-sm">
          <AdminLoginForm />
        </div>
      </main>
    </div>
  );
}
