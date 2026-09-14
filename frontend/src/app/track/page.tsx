import type { Metadata } from "next";
import { Footer } from "@/components/landing/Footer";
import { NavBar } from "@/components/landing/NavBar";
import { TrackEntryForm } from "@/components/track/TrackEntryForm";

export const metadata: Metadata = {
  title: "Track Your Ticket — Incident Desk",
  description: "Find every ticket filed under your email, or jump straight to one with its ticket ID.",
};

export default function TrackPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">
      <NavBar />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-xl px-4 py-10 sm:px-6 md:py-14">
          <TrackEntryForm />
        </div>
      </main>
      <Footer />
    </div>
  );
}
