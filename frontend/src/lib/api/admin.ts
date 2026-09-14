import { apiFetch } from "@/lib/api/client";
import { mapResponse, mapTicketDetail, mapTicketSummary } from "@/lib/api/mappers";
import type { Ticket, TicketPriority, TicketResponse, TicketStatus } from "@/lib/types/ticket";

export interface ListTicketsParams {
  status?: string;
  priority?: string;
  search?: string;
}

// GET /api/admin/tickets/?status=&priority=&search= (paginated; MVP reads only the first page)
export async function listTickets(params: ListTicketsParams = {}): Promise<Ticket[]> {
  const query = new URLSearchParams();
  if (params.status && params.status !== "All") query.set("status", params.status);
  if (params.priority && params.priority !== "All") query.set("priority", params.priority);
  if (params.search) query.set("search", params.search);
  const qs = query.toString();

  const data = await apiFetch<{ results: Parameters<typeof mapTicketSummary>[0][] }>(
    `/api/admin/tickets/${qs ? `?${qs}` : ""}`,
  );
  if (!data) return [];
  return data.results.map(mapTicketSummary);
}

export interface UpdateTicketPatch {
  status?: TicketStatus;
  priority?: TicketPriority;
}

// PATCH /api/admin/tickets/<id>/
export async function updateTicket(id: string, patch: UpdateTicketPatch): Promise<Ticket> {
  const data = await apiFetch<Parameters<typeof mapTicketDetail>[0]>(`/api/admin/tickets/${id}/`, {
    method: "PATCH",
    body: patch,
  });
  if (!data) throw new Error(`No ticket found for id ${id}`);
  return mapTicketDetail(data);
}

export interface TicketDetail {
  ticket: Ticket;
  responses: TicketResponse[];
}

// GET /api/admin/tickets/<id>/
export async function getTicketDetail(id: string): Promise<TicketDetail | null> {
  const data = await apiFetch<Parameters<typeof mapTicketDetail>[0] & { responses: Parameters<typeof mapResponse>[0][] }>(
    `/api/admin/tickets/${id}/`,
  );
  if (!data) return null;
  return { ticket: mapTicketDetail(data), responses: data.responses.map(mapResponse) };
}

export interface AddAdminResponseInput {
  message: string;
  notifyClient: boolean;
}

// POST /api/admin/tickets/<id>/responses/ — the reply's displayed author name comes from the
// logged-in session server-side, not a client-supplied value.
export async function addAdminResponse(id: string, input: AddAdminResponseInput): Promise<TicketResponse> {
  const data = await apiFetch<Parameters<typeof mapResponse>[0]>(`/api/admin/tickets/${id}/responses/`, {
    method: "POST",
    body: { message: input.message, notify_client: input.notifyClient },
  });
  if (!data) throw new Error(`No ticket found for id ${id}`);
  return mapResponse(data);
}
