import type { Ticket, TicketResponse } from "@/lib/types/ticket";

const SEED_TICKETS: Ticket[] = [
  {
    id: "1",
    token: "d4a1f2b6-9c3a-4e21-8b7a-11e2f0c9a6d4",
    title: "Checkout page returns a 500 error",
    description:
      "Since this morning around 8:40am, submitting payment on the checkout page returns a 500 " +
      'Internal Server Error right after clicking "Pay now." I\'ve tried two different cards and ' +
      "cleared my browser cache — same result both times. This is blocking customers from " +
      "completing purchases.",
    status: "In Progress",
    priority: "High",
    clientName: "Ada Lovelace",
    clientEmail: "ada@example.com",
    createdAt: "2026-09-10T09:02:00",
    updatedAt: "2026-09-10T14:02:00",
    resolvedAt: null,
    statusHistory: { Open: "2026-09-10T09:02:00", "In Progress": "2026-09-10T11:15:00" },
    attachments: [
      { id: "a1", name: "checkout-error-screenshot.png", size: 1240000, kind: "image" },
      { id: "a2", name: "browser-console.log", size: 34200, kind: "file" },
    ],
  },
  {
    id: "2",
    token: "8b02c9e1-4f7d-42aa-9c31-6e1d5a9b7f02",
    title: "Password reset email not arriving",
    description:
      "I requested a password reset three times in the last hour but the email never arrives — " +
      "I checked spam too.",
    status: "Open",
    priority: "High",
    clientName: "Grace Hopper",
    clientEmail: "grace@example.com",
    createdAt: "2026-09-13T16:40:00",
    updatedAt: "2026-09-13T16:40:00",
    resolvedAt: null,
    statusHistory: { Open: "2026-09-13T16:40:00" },
    attachments: [],
  },
  {
    id: "3",
    token: "1e6a77f0-2c11-4d8e-8a4f-9b3c2e7d1a05",
    title: "Dashboard chart fails to load on Safari",
    description:
      "The resolution-velocity chart on the analytics dashboard never renders in Safari 17 — it " +
      "works fine in Chrome and Firefox.",
    status: "Open",
    priority: "Medium",
    clientName: "Alan Turing",
    clientEmail: "alan@example.com",
    createdAt: "2026-09-12T10:05:00",
    updatedAt: "2026-09-12T10:05:00",
    resolvedAt: null,
    statusHistory: { Open: "2026-09-12T10:05:00" },
    attachments: [],
  },
  {
    id: "4",
    token: "77cf3a4d-e809-4b6a-9f21-3c8d5e0a6b17",
    title: "API rate limit hit during CSV import",
    description:
      "Importing our 5,000-row client CSV hits the API rate limit around row 2,000 and the rest " +
      "silently fail to import.",
    status: "In Progress",
    priority: "Medium",
    clientName: "Margaret Hamilton",
    clientEmail: "margaret@example.com",
    createdAt: "2026-09-11T08:15:00",
    updatedAt: "2026-09-11T09:40:00",
    resolvedAt: null,
    statusHistory: { Open: "2026-09-11T08:15:00", "In Progress": "2026-09-11T09:40:00" },
    attachments: [],
  },
  {
    id: "5",
    token: "0f5b91aa-33c6-4e7f-8d12-5a9c3b6e0f24",
    title: "Typo in invoice PDF footer",
    description:
      'The generated invoice PDF footer says "Thank you for you business" — missing the r in ' +
      '"your."',
    status: "Resolved",
    priority: "Low",
    clientName: "Tim Berners-Lee",
    clientEmail: "tim@example.com",
    createdAt: "2026-09-02T13:20:00",
    updatedAt: "2026-09-03T09:10:00",
    resolvedAt: "2026-09-03T09:10:00",
    statusHistory: { Open: "2026-09-02T13:20:00", Resolved: "2026-09-03T09:10:00" },
    attachments: [],
  },
  {
    id: "6",
    token: "c2d4e6f8-19ab-4f3d-8e56-7a0b2c9d4e31",
    title: "Unable to upload attachments over 2MB",
    description:
      "The report form silently rejects any attachment larger than 2MB instead of showing an " +
      "error message.",
    status: "Resolved",
    priority: "Medium",
    clientName: "Radia Perlman",
    clientEmail: "radia@example.com",
    createdAt: "2026-09-04T11:00:00",
    updatedAt: "2026-09-06T15:30:00",
    resolvedAt: "2026-09-06T15:30:00",
    statusHistory: {
      Open: "2026-09-04T11:00:00",
      "In Progress": "2026-09-04T18:00:00",
      Resolved: "2026-09-06T15:30:00",
    },
    attachments: [],
  },
  {
    id: "7",
    token: "5a1029bd-77e3-4c6a-9f18-2d5e8b0a3c47",
    title: "Slack integration disconnects randomly",
    description:
      "Our Slack notification channel disconnects roughly once a day and has to be manually " +
      "reconnected from settings.",
    status: "Resolved",
    priority: "High",
    clientName: "Katherine Johnson",
    clientEmail: "katherine@example.com",
    createdAt: "2026-09-05T09:45:00",
    updatedAt: "2026-09-05T22:00:00",
    resolvedAt: "2026-09-05T22:00:00",
    statusHistory: {
      Open: "2026-09-05T09:45:00",
      "In Progress": "2026-09-05T12:00:00",
      Resolved: "2026-09-05T22:00:00",
    },
    attachments: [],
  },
  {
    id: "8",
    token: "e93f6c02-8a4d-4b17-9e3a-6c1d0f5b2a89",
    title: "CSV export missing last 3 rows",
    description:
      "Exporting the ticket list to CSV consistently drops the final three rows regardless of " +
      "filters applied.",
    status: "Open",
    priority: "Low",
    clientName: "Hedy Lamarr",
    clientEmail: "hedy@example.com",
    createdAt: "2026-09-14T07:30:00",
    updatedAt: "2026-09-14T07:30:00",
    resolvedAt: null,
    statusHistory: { Open: "2026-09-14T07:30:00" },
    attachments: [],
  },
  {
    id: "9",
    token: "42bb018f-c5d7-4e2a-8b6f-1d9c3a7e0b52",
    title: "Dark mode toggle resets on refresh",
    description:
      "Switching to dark mode works, but it silently reverts to light mode every time the page " +
      "is refreshed.",
    status: "Resolved",
    priority: "Low",
    clientName: "Barbara Liskov",
    clientEmail: "barbara@example.com",
    createdAt: "2026-09-01T10:00:00",
    updatedAt: "2026-09-08T17:45:00",
    resolvedAt: "2026-09-08T17:45:00",
    statusHistory: { Open: "2026-09-01T10:00:00", Resolved: "2026-09-08T17:45:00" },
    attachments: [],
  },
  {
    id: "10",
    token: "9d3e5f71-0b28-4a6c-8d43-2e7f1a9c5b06",
    title: "Billing address won't save",
    description:
      "Updating the billing address in account settings shows a success toast, but the old " +
      "address is still shown on next load.",
    status: "In Progress",
    priority: "High",
    clientName: "Shafi Goldwasser",
    clientEmail: "shafi@example.com",
    createdAt: "2026-09-09T14:12:00",
    updatedAt: "2026-09-09T16:00:00",
    resolvedAt: null,
    statusHistory: { Open: "2026-09-09T14:12:00", "In Progress": "2026-09-09T16:00:00" },
    attachments: [],
  },
];

const SEED_RESPONSES: TicketResponse[] = [
  {
    id: "r1",
    authorType: "Client",
    author: "Ada Lovelace",
    message: "Also noticed this happens on mobile Safari too, not just desktop Chrome.",
    createdAt: "2026-09-10T09:20:00",
  },
  {
    id: "r2",
    authorType: "Admin",
    author: "Priya N.",
    message:
      "Thanks for the report, Ada — I can reproduce this on our staging checkout. Looks like a " +
      "timeout in the payment gateway call. Escalating this to High priority and digging in now.",
    createdAt: "2026-09-10T11:16:00",
  },
  {
    id: "r3",
    authorType: "Admin",
    author: "Priya N.",
    message:
      "Found it — a recent deploy changed the payment gateway timeout to 3 seconds, too short " +
      "under load. Rolling back that config now; this should be resolved within the hour.",
    createdAt: "2026-09-10T14:02:00",
  },
];

/**
 * In-memory mock "database" — resets on full page reload. Stands in for
 * PostgreSQL until the Django backend exists; visit
 * /tickets/d4a1f2b6-9c3a-4e21-8b7a-11e2f0c9a6d4 (public) or
 * /admin/tickets/1 (admin) to see the seeded ticket with its full thread.
 */
const ticketsById = new Map<string, Ticket>(SEED_TICKETS.map((t) => [t.id, t]));
const ticketsByToken = new Map<string, Ticket>(SEED_TICKETS.map((t) => [t.token, t]));
const responsesByToken = new Map<string, TicketResponse[]>([
  [SEED_TICKETS[0].token, SEED_RESPONSES],
]);

export function findTicket(token: string): Ticket | undefined {
  return ticketsByToken.get(token);
}

export function findTicketById(id: string): Ticket | undefined {
  return ticketsById.get(id);
}

export function listAllTickets(): Ticket[] {
  return Array.from(ticketsById.values());
}

export function findResponses(token: string): TicketResponse[] {
  return responsesByToken.get(token) ?? [];
}

export function appendResponse(token: string, response: TicketResponse): void {
  responsesByToken.set(token, [...findResponses(token), response]);
}

export function updateTicketById(
  id: string,
  patch: Partial<Pick<Ticket, "status" | "priority">>,
): Ticket | undefined {
  const existing = ticketsById.get(id);
  if (!existing) return undefined;

  const now = new Date().toISOString();
  const updated: Ticket = {
    ...existing,
    ...patch,
    updatedAt: now,
    resolvedAt: patch.status
      ? patch.status === "Resolved"
        ? existing.resolvedAt ?? now
        : null
      : existing.resolvedAt,
    statusHistory: patch.status
      ? { ...existing.statusHistory, [patch.status]: existing.statusHistory[patch.status] ?? now }
      : existing.statusHistory,
  };

  ticketsById.set(id, updated);
  ticketsByToken.set(updated.token, updated);
  return updated;
}
