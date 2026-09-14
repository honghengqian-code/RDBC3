export type TicketStatus = "Open" | "In Progress" | "Resolved";
export type TicketPriority = "Low" | "Medium" | "High";
export type ResponseAuthorType = "Admin" | "Client";

export interface Ticket {
  id: string;
  token: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  clientName: string;
  clientEmail: string;
  createdAt: string;
  updatedAt: string;
  /** Set once, the moment status first transitions to "Resolved"; null until then. */
  resolvedAt: string | null;
  /** Timestamp each status was first reached; absent/undefined means not reached yet. */
  statusHistory: Partial<Record<TicketStatus, string>>;
  attachments: TicketAttachment[];
}

export interface TicketAttachment {
  id: string;
  name: string;
  size: number;
  kind: "image" | "file";
}

export interface TicketResponse {
  id: string;
  authorType: ResponseAuthorType;
  author: string;
  message: string;
  createdAt: string;
}
