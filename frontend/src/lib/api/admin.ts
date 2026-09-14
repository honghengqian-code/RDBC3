import { apiFetch } from "@/lib/api/client";
import { mapResponse, mapTicketDetail, mapTicketSummary } from "@/lib/api/mappers";
import type { Ticket, TicketPriority, TicketResponse, TicketStatus } from "@/lib/types/ticket";

// Must match the backend's REST_FRAMEWORK["PAGE_SIZE"] (config/settings.py) — there's no
// endpoint that reports it, so it's duplicated here rather than fetched.
export const ADMIN_PAGE_SIZE = 20;

export interface ListTicketsParams {
  status?: string;
  priority?: string;
  search?: string;
  /** 1-indexed, matching DRF's PageNumberPagination. */
  page?: number;
}

export interface ListTicketsResult {
  tickets: Ticket[];
  /** Total tickets matching the given filters (server-computed), not just this page's length. */
  count: number;
}

// GET /api/admin/tickets/?status=&priority=&search=&page=
export async function listTickets(params: ListTicketsParams = {}): Promise<ListTicketsResult> {
  const query = new URLSearchParams();
  if (params.status && params.status !== "All") query.set("status", params.status);
  if (params.priority && params.priority !== "All") query.set("priority", params.priority);
  if (params.search) query.set("search", params.search);
  if (params.page && params.page > 1) query.set("page", String(params.page));
  const qs = query.toString();

  const data = await apiFetch<{ results: Parameters<typeof mapTicketSummary>[0][]; count: number }>(
    `/api/admin/tickets/${qs ? `?${qs}` : ""}`,
  );
  if (!data) return { tickets: [], count: 0 };
  return { tickets: data.results.map(mapTicketSummary), count: data.count };
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

// POST /api/admin/tickets/bulk-delete/ — also used to delete a single selected ticket,
// since the dashboard never needs to distinguish the two.
export async function deleteTickets(ids: string[]): Promise<number> {
  const data = await apiFetch<{ deleted: number }>("/api/admin/tickets/bulk-delete/", {
    method: "POST",
    body: { ids },
  });
  return data?.deleted ?? 0;
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
  attachments: File[];
}

// POST /api/admin/tickets/<id>/responses/ — the reply's displayed author name comes from the
// logged-in session server-side, not a client-supplied value. Multipart whenever there's at
// least one file, since a JSON body can't carry raw File objects.
export async function addAdminResponse(id: string, input: AddAdminResponseInput): Promise<TicketResponse> {
  let body: unknown;
  if (input.attachments.length > 0) {
    const form = new FormData();
    form.set("message", input.message);
    form.set("notify_client", String(input.notifyClient));
    for (const file of input.attachments) form.append("attachments", file);
    body = form;
  } else {
    body = { message: input.message, notify_client: input.notifyClient };
  }
  const data = await apiFetch<Parameters<typeof mapResponse>[0]>(`/api/admin/tickets/${id}/responses/`, {
    method: "POST",
    body,
  });
  if (!data) throw new Error(`No ticket found for id ${id}`);
  return mapResponse(data);
}
