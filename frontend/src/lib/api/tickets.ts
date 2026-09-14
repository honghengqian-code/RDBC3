import { appendResponse, findResponses, findTicket } from "@/lib/mock/ticket-store";
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

function generateToken(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Stands in for POST /api/public/tickets/ (multipart, incl. attachments) until the Django backend exists.
export async function createTicket(input: CreateTicketInput): Promise<CreateTicketResult> {
  void input;
  await new Promise((resolve) => setTimeout(resolve, 900));
  const token = generateToken();
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
