"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { getAdminSession, type AdminSession } from "@/lib/mock/admin-auth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<AdminSession | null | "checking">("checking");

  useEffect(() => {
    const current = getAdminSession();
    setSession(current);
    if (!current && pathname !== "/admin/login") {
      console.warn("[AdminLayout] no admin session, redirecting to /admin/login");
      router.replace("/admin/login");
    }
  }, [pathname, router]);

  // The login page renders its own full-page chrome — no shell/guard around it.
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (session === "checking" || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
        <p className="text-sm text-[var(--muted)]">Checking session…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">
      <AdminHeader session={session} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
