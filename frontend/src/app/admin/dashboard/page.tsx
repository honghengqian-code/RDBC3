import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminDashboardView } from "@/components/admin/AdminDashboardView";

export const metadata: Metadata = {
  title: "Admin Dashboard — Incident Desk",
  description: "Filterable ticket list and analytics for the support team.",
};

export default function AdminDashboardPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 md:py-10">
      <Suspense fallback={<p className="text-sm text-[var(--muted)]">Loading dashboard…</p>}>
        <AdminDashboardView />
      </Suspense>
    </div>
  );
}
