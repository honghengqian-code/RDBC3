import type { TicketPriority, TicketStatus } from "@/lib/types/ticket";

export const STATUS_ORDER: TicketStatus[] = ["Open", "In Progress", "Resolved"];
export const PRIORITY_ORDER: TicketPriority[] = ["Low", "Medium", "High"];

export const STATUS_META: Record<TicketStatus, { color: string; soft: string }> = {
  Open: { color: "var(--status-open)", soft: "var(--status-open-soft)" },
  "In Progress": { color: "var(--status-prog)", soft: "var(--status-prog-soft)" },
  Resolved: { color: "var(--status-res)", soft: "var(--status-res-soft)" },
};

export const STATUS_HELPER: Record<TicketStatus, string> = {
  Open: "Just filed — waiting for a team member to pick it up.",
  "In Progress": "A team member is actively working on this.",
  Resolved: "This issue has been fixed and closed.",
};

export const PRIORITY_META: Record<TicketPriority, { color: string; soft: string }> = {
  Low: { color: "var(--pri-low)", soft: "var(--pri-low-soft)" },
  Medium: { color: "var(--pri-med)", soft: "var(--pri-med-soft)" },
  High: { color: "var(--pri-high)", soft: "var(--pri-high-soft)" },
};
