import { apiFetch } from "@/lib/api/client";
import { mapResponse, mapTicketDetail, mapTicketSummary } from "@/lib/api/mappers";
import type { Ticket, TicketResponse } from "@/lib/types/ticket";

export interface CreateTicketInput {
  name: string;
  email: string;
  title: string;
  description: string;
  /** Not yet persisted — Attachment storage is out of MVP scope, see CLAUDE.md 3.2. */
  attachments: File[];
}

export interface CreateTicketResult {
  token: string;
  link: string;
}

// POST /api/public/tickets/
export async function createTicket(input: CreateTicketInput): Promise<CreateTicketResult> {
  const data = await apiFetch<{ token: string }>("/api/public/tickets/", {
    method: "POST",
    body: { name: input.name, email: input.email, title: input.title, description: input.description },
  });
  if (!data) throw new Error("Ticket creation returned no data.");
  return { token: data.token, link: `${window.location.origin}/tickets/${data.token}` };
}

export interface TicketWithResponses {
  ticket: Ticket;
  responses: TicketResponse[];
}

// GET /api/public/tickets/<token>/
export async function getTicketByToken(token: string): Promise<TicketWithResponses | null> {
  const data = await apiFetch<Parameters<typeof mapTicketDetail>[0] & { responses: Parameters<typeof mapResponse>[0][] }>(
    `/api/public/tickets/${encodeURIComponent(token)}/`,
  );
  if (!data) return null;
  return { ticket: mapTicketDetail(data), responses: data.responses.map(mapResponse) };
}

// POST /api/public/tickets/<token>/responses/
export async function addTicketResponse(token: string, message: string): Promise<TicketResponse> {
  const data = await apiFetch<Parameters<typeof mapResponse>[0]>(
    `/api/public/tickets/${encodeURIComponent(token)}/responses/`,
    { method: "POST", body: { message } },
  );
  if (!data) throw new Error("Reply submission returned no data.");
  return mapResponse(data);
}

export interface RequestTrackingLinkResult {
  status: "ok";
}

// POST /api/public/tickets/lookup/ — always the same response shape whether or not the
// address has any tickets, so this can't be used to enumerate who has filed one.
export async function requestTrackingLink(email: string): Promise<RequestTrackingLinkResult> {
  await apiFetch("/api/public/tickets/lookup/", { method: "POST", body: { query: email } });
  return { status: "ok" };
}

export interface TrackedTicketList {
  email: string;
  tickets: Ticket[];
}

// GET /api/public/tickets/track/<verify_token>/
export async function getTrackedTickets(verifyToken: string): Promise<TrackedTicketList | null> {
  const data = await apiFetch<{ email: string; tickets: Parameters<typeof mapTicketSummary>[0][] }>(
    `/api/public/tickets/track/${encodeURIComponent(verifyToken)}/`,
  );
  if (!data) return null;
  return { email: data.email, tickets: data.tickets.map(mapTicketSummary) };
}
