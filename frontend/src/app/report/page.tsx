import type { Metadata } from "next";
import { Footer } from "@/components/landing/Footer";
import { NavBar } from "@/components/landing/NavBar";
import { IncidentForm } from "@/components/report/IncidentForm";

export const metadata: Metadata = {
  title: "Report an Incident — Incident Desk",
  description: "Submit a support ticket in under a minute — no account required.",
};

export default function ReportPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">
      <NavBar />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-xl px-4 py-10 sm:px-6 md:py-14">
          <IncidentForm />
          <p className="mt-6 text-center text-xs text-[var(--muted)]">
            Already have a ticket link? Open it from your email to check its status — no sign-in
            needed.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
