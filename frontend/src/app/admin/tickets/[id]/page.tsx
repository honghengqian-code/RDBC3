import type { Metadata } from "next";
import { AdminTicketDetailView } from "@/components/admin/AdminTicketDetailView";

export const metadata: Metadata = {
  title: "Ticket Detail — Incident Desk Admin",
  description: "Review a ticket's details and reply to the client.",
};

export default function AdminTicketDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 md:py-8">
      <AdminTicketDetailView id={params.id} />
    </div>
  );
}
