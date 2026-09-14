import type { Metadata } from "next";
import { Footer } from "@/components/landing/Footer";
import { NavBar } from "@/components/landing/NavBar";
import { TicketStatusView } from "@/components/ticket-status/TicketStatusView";

export const metadata: Metadata = {
  title: "Ticket Status — Incident Desk",
  description: "Track your incident ticket's status and reply to our team — no login required.",
};

export default function TicketStatusPage({ params }: { params: { token: string } }) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">
      <NavBar />
      <main className="flex-1">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 py-10 sm:px-6 md:py-14">
          <TicketStatusView token={params.token} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
