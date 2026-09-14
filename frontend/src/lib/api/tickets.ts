import { generateId } from "@/lib/mock/generate-id";
import {
  appendResponse,
  createVerification,
  findResponses,
  findTicket,
  findTicketsByEmail,
  resolveVerification,
} from "@/lib/mock/ticket-store";
import type { Ticket, TicketResponse } from "@/lib/types/ticket";

const TICKET_DOMAIN = "https://helpdesk.example.com";

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

// Stands in for POST /api/public/tickets/ (multipart, incl. attachments) until the Django backend exists.
export async function createTicket(input: CreateTicketInput): Promise<CreateTicketResult> {
  void input;
  await new Promise((resolve) => setTimeout(resolve, 900));
  const token = generateId();
  return { token, link: `${TICKET_DOMAIN}/tickets/${token}` };
}

export interface TicketWithResponses {
  ticket: Ticket;
  responses: TicketResponse[];
}

// Stands in for GET /api/public/tickets/<token>/ until the Django backend exists.
export async function getTicketByToken(token: string): Promise<TicketWithResponses | null> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const ticket = findTicket(token);
  if (!ticket) return null;
  return { ticket, responses: findResponses(token) };
}

// Stands in for POST /api/public/tickets/<token>/responses/ until the Django backend exists.
export async function addTicketResponse(token: string, message: string): Promise<TicketResponse> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const ticket = findTicket(token);
  if (!ticket) throw new Error(`No ticket found for token ${token}`);
  const response: TicketResponse = {
    id: `r-${Date.now()}`,
    authorType: "Client",
    author: ticket.clientName,
    message,
    createdAt: new Date().toISOString(),
  };
  appendResponse(token, response);
  return response;
}

export interface RequestTrackingLinkResult {
  status: "ok";
  /**
   * Dev-only convenience: the direct verification URL, since there's no real email backend yet.
   * A production response must never include this — the link only ever reaches the real inbox.
   */
  devVerifyUrl?: string;
}

// Stands in for POST /api/public/tickets/lookup/ until the Django backend exists. Always
// returns the same shape regardless of whether the email has any tickets, so this can't be
// used to enumerate which addresses have filed tickets.
export async function requestTrackingLink(email: string): Promise<RequestTrackingLinkResult> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  const verifyToken = createVerification(email);
  return { status: "ok", devVerifyUrl: `/track/${verifyToken}` };
}

export interface TrackedTicketList {
  email: string;
  tickets: Ticket[];
}

// Stands in for GET /api/public/tickets/track/<verify_token>/ until the Django backend exists.
export async function getTrackedTickets(verifyToken: string): Promise<TrackedTicketList | null> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const resolved = resolveVerification(verifyToken);
  if (!resolved) return null;
  return { email: resolved.email, tickets: findTicketsByEmail(resolved.email) };
}
