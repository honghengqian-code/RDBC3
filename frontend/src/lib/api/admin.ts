import {
  appendResponse,
  findResponses,
  findTicketById,
  listAllTickets,
  updateTicketById,
} from "@/lib/mock/ticket-store";
import type { Ticket, TicketPriority, TicketResponse, TicketStatus } from "@/lib/types/ticket";

// Stands in for GET /api/admin/tickets/?status=&priority=&search= until the Django backend
// exists. Filtering happens client-side in useTicketList against this full set.
export async function listTickets(): Promise<Ticket[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return listAllTickets();
}

export interface UpdateTicketPatch {
  status?: TicketStatus;
  priority?: TicketPriority;
}

// Stands in for PATCH /api/admin/tickets/<id>/ until the Django backend exists.
export async function updateTicket(id: string, patch: UpdateTicketPatch): Promise<Ticket> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  const updated = updateTicketById(id, patch);
  if (!updated) throw new Error(`No ticket found for id ${id}`);
  return updated;
}

export interface TicketDetail {
  ticket: Ticket;
  responses: TicketResponse[];
}

// Stands in for GET /api/admin/tickets/<id>/ until the Django backend exists.
export async function getTicketDetail(id: string): Promise<TicketDetail | null> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const ticket = findTicketById(id);
  if (!ticket) return null;
  return { ticket, responses: findResponses(ticket.token) };
}

export interface AddAdminResponseInput {
  message: string;
  notifyClient: boolean;
  authorName: string;
}

// Stands in for POST /api/admin/tickets/<id>/responses/ until the Django backend exists.
export async function addAdminResponse(
  id: string,
  input: AddAdminResponseInput,
): Promise<TicketResponse> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const ticket = findTicketById(id);
  if (!ticket) throw new Error(`No ticket found for id ${id}`);
  const response: TicketResponse = {
    id: `r-${Date.now()}`,
    authorType: "Admin",
    author: input.authorName,
    message: input.message,
    createdAt: new Date().toISOString(),
  };
  appendResponse(ticket.token, response);
  return response;
}
