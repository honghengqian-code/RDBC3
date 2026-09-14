import type { TicketPriority, TicketStatus } from "@/lib/types/ticket";

export interface StatusCount {
  status: TicketStatus;
  count: number;
}

export interface PriorityCount {
  priority: TicketPriority;
  count: number;
}

export interface ResolutionPoint {
  label: string;
  days: number;
}

export interface AnalyticsSummary {
  totalTickets: number;
  openCount: number;
  closedCount: number;
  avgResolutionHours: number | null;
  byStatus: StatusCount[];
  byPriority: PriorityCount[];
  resolutionVelocity: ResolutionPoint[];
}
