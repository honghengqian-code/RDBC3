/**
 * Backend (DRF) responses are snake_case and, depending on the endpoint,
 * only carry a subset of the frontend's `Ticket` shape (the public
 * serializer never exposes internal `id`; the admin *list* serializer
 * skips description/attachments/status history to keep the dashboard
 * payload light). These helpers normalize both into the full frontend
 * shape, filling the fields a given endpoint doesn't send with safe,
 * unused-by-that-view defaults.
 */
import type { Ticket, TicketResponse } from "@/lib/types/ticket";

interface BackendResponse {
  id: string;
  author_type: "Admin" | "Client";
  author: string;
  message: string;
  created_at: string;
}

export function mapResponse(json: BackendResponse): TicketResponse {
  return {
    id: json.id,
    authorType: json.author_type,
    author: json.author,
    message: json.message,
    createdAt: json.created_at,
  };
}

interface BackendTicketDetail {
  id?: string;
  token: string;
  title: string;
  description: string;
  status: Ticket["status"];
  priority: Ticket["priority"];
  client_name: string;
  client_email: string;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  status_history: Record<string, string>;
  attachments: Ticket["attachments"];
}

/** For the public and admin *detail* serializers — everything but `id` is always present. */
export function mapTicketDetail(json: BackendTicketDetail): Ticket {
  return {
    id: json.id ?? json.token,
    token: json.token,
    title: json.title,
    description: json.description,
    status: json.status,
    priority: json.priority,
    clientName: json.client_name,
    clientEmail: json.client_email,
    createdAt: json.created_at,
    updatedAt: json.updated_at,
    resolvedAt: json.resolved_at,
    statusHistory: json.status_history,
    attachments: json.attachments,
  };
}

interface BackendTicketSummary {
  id: string;
  token: string;
  title: string;
  status: Ticket["status"];
  priority: Ticket["priority"];
  client_name: string;
  client_email: string;
  created_at: string;
  resolved_at: string | null;
}

/** For the admin *list* / track-list serializer — list views never need description/attachments/history. */
export function mapTicketSummary(json: BackendTicketSummary): Ticket {
  return {
    id: json.id,
    token: json.token,
    title: json.title,
    description: "",
    status: json.status,
    priority: json.priority,
    clientName: json.client_name,
    clientEmail: json.client_email,
    createdAt: json.created_at,
    updatedAt: json.created_at,
    resolvedAt: json.resolved_at,
    statusHistory: {},
    attachments: [],
  };
}
