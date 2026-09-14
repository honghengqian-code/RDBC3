import type { Metadata } from "next";
import { Footer } from "@/components/landing/Footer";
import { NavBar } from "@/components/landing/NavBar";
import { TrackedTicketsView } from "@/components/track/TrackedTicketsView";

export const metadata: Metadata = {
  title: "Your Tickets — Incident Desk",
  description: "All tickets filed under your email.",
};

export default function TrackedTicketsPage({ params }: { params: { verifyToken: string } }) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">
      <NavBar />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 md:py-14">
          <TrackedTicketsView verifyToken={params.verifyToken} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
