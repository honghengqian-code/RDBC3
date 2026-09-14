import { apiFetch } from "@/lib/api/client";
import { mapResponse, mapTicketDetail, mapTicketSummary } from "@/lib/api/mappers";
import type { Ticket, TicketResponse } from "@/lib/types/ticket";

export interface CreateTicketInput {
  name: string;
  email: string;
  title: string;
  description: string;
  attachments: File[];
}

export interface CreateTicketResult {
  token: string;
  link: string;
}

// POST /api/public/tickets/ — multipart whenever there's at least one file, since a JSON
// body can't carry raw File objects.
export async function createTicket(input: CreateTicketInput): Promise<CreateTicketResult> {
  let body: unknown;
  if (input.attachments.length > 0) {
    const form = new FormData();
    form.set("name", input.name);
    form.set("email", input.email);
    form.set("title", input.title);
    form.set("description", input.description);
    for (const file of input.attachments) form.append("attachments", file);
    body = form;
  } else {
    body = { name: input.name, email: input.email, title: input.title, description: input.description };
  }
  const data = await apiFetch<{ token: string }>("/api/public/tickets/", { method: "POST", body });
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
