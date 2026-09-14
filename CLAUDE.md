# CLAUDE.md — Ticket Management System

This file is the single source of truth for how this project is built. It is both the
architecture plan and the operating context Claude Code should load before doing
any work here. Read it before writing code, and keep it in sync when the plan
changes — this document should always reflect the intended architecture, not just
the day it was written.

---

## 1. PROJECT CONTEXT & CONVENTIONS

### 1.1 Project Overview

A **Ticket Management System for Incidents** that lets users submit, track, and
resolve support tickets **without creating an account**. Client identification is
handled via a unique token embedded in a link that is emailed to the user on
ticket creation — no username/password flow exists for end users.

- **Frontend:** Next.js 14 (App Router) + Tailwind CSS
- **Backend:** Django 5.1 + Django REST Framework
- **Database:** PostgreSQL
- **Infra:** Docker + docker-compose (local & deployment parity)
- **Admins** authenticate normally (Django admin auth / session or token auth on
  a protected `/admin/*` API namespace); **clients never log in**.

Core user stories driving the design:
- *"As a customer, I want to submit an incident ticket and receive a unique link
  to track its status without creating an account."*
- *"As a customer service representative, I want to update ticket statuses and
  leave comments, so users stay informed about the progress."*
- *"As an admin, I want to view insights about ticket volumes and resolution
  times, so I can identify bottlenecks."*

### 1.2 Monorepo Layout

```
/RDBC3
├── CLAUDE.md                  # this file — source of truth
├── README.md                  # setup/run/deploy instructions (for humans)
├── docker-compose.yml          # orchestrates frontend, backend, db
├── docker-compose.override.yml # local dev overrides (hot reload, volumes)
│
├── frontend/                  # Next.js 14 App Router app
│   ├── Dockerfile
│   ├── src/
│   │   └── ...                 # see Section 2 for full map
│   ├── package.json
│   └── .env.local.example
│
└── backend/                   # Django 5.1 + DRF project
    ├── Dockerfile
    ├── manage.py
    ├── config/                 # Django project settings package
    ├── apps/
    │   ├── tickets/             # Client, Ticket, Response models + API
    │   └── analytics/           # aggregation endpoints
    ├── requirements.txt
    └── .env.example
```

### 1.3 Coding Guidelines

- **Language/typing:** TypeScript everywhere on the frontend (`strict: true`).
  Python type hints on all Django model methods, serializers, and views.
- **Formatting:** Prettier + ESLint (frontend), Black + Ruff (backend). No
  unformatted commits — wire these into pre-commit if not already present.
- **Naming:** REST resources are plural nouns (`/api/tickets/`), DB tables
  follow Django's default app-label naming, React components are PascalCase,
  hooks are `useX`.
- **No dead code / no speculative abstraction.** Build exactly what the current
  page or endpoint needs; do not pre-build for hypothetical future ticket types,
  auth methods, etc.
- **Secrets:** never commit `.env` files. `.env.example` files document required
  vars for both `frontend/` and `backend/`.
- **Tests live next to the code they test** (`__tests__/` colocated in frontend,
  `tests.py` / `tests/` per Django app in backend). Target ≥70% coverage on
  critical paths (ticket creation, token access, status updates), per project
  brief.
- **Error handling & logging.** Important functions — anything that talks to
  the network, the database, the filesystem, or another service — must not
  fail silently or crash unhandled. Wrap the risky part in `try`/`except`
  (backend) or `try`/`catch` (frontend), handle or surface the failure
  deliberately, and log enough to debug it later without reproducing it:
  - **Backend (Django):** module-level `logger = logging.getLogger(__name__)`
    in views, serializers, signal handlers, and services. `logger.info(...)`
    on key lifecycle events (ticket created, status changed, email sent/failed,
    lookup attempted) and `logger.exception(...)` inside an `except` block so
    the traceback is captured. Log identifiers (ticket id/token), never raw
    PII like full email bodies. Configure `LOGGING` in settings to write to
    console in dev.
  - **Frontend (Next.js):** wrap API calls in `try`/`catch` — never an
    unhandled rejected promise — and pair the user-facing error state (e.g.
    `IncidentForm`'s `submitError`) with a `console.error(...)` that includes
    the error and relevant context (which request, which id/token), so
    failures are visible in the browser console during development. A
    `console.info`/`console.debug` on a key success path (ticket created,
    lookup resolved) is welcome too — it's what makes "is this actually
    working" answerable at a glance while building.
  - Scope this to functions where a failure or a milestone actually matters
    for correctness or debugging — not every trivial getter or pure helper.
    The goal is signal, not noise: a console/log full of unimportant lines is
    as hard to debug from as one with nothing in it.

### 1.4 Git Workflow

- `main` — always deployable.
- `feature/<short-name>` branches per unit of work, e.g.:
  - `feature/client-identification`
  - `feature/ticket-creation`
  - `feature/admin-dashboard`
  - `feature/analytics`
- Commit early and often with meaningful messages (imperative mood: "Add token
  generation to Client model", not "fixed stuff").
- Open a PR into `main` per feature branch; do not commit directly to `main`
  once collaborators are involved.
- Never force-push shared branches; never rewrite `main` history.

### 1.5 Developer Rules for Claude Code

- Do not scaffold application source code until explicitly asked — this file is
  the planning document; implementation happens in follow-up tasks per section.
- When implementing a section of this plan, re-read the relevant part of this
  file first and follow it; if reality forces a deviation, update this file in
  the same change so it stays authoritative.
- Prefer editing existing files over creating new ones; don't introduce new
  top-level directories beyond `frontend/` and `backend/` without discussion.
- Keep public (client-facing, token-authenticated) and admin (session/token
  authenticated) API surfaces clearly separated in code (see 3.4) — never let a
  public endpoint leak another client's ticket data.

### 1.6 CLI Commands Cheat Sheet

**Docker / Compose**
```bash
docker-compose up --build          # build & start all services
docker-compose up -d               # start in background
docker-compose down                # stop and remove containers
docker-compose logs -f backend     # tail backend logs
docker-compose exec backend bash   # shell into backend container
docker-compose exec frontend sh    # shell into frontend container
```

**Django (run inside backend container, or via `docker-compose exec backend`)**
```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py shell
python manage.py test                       # run backend test suite
python manage.py test apps.tickets          # run one app's tests
python manage.py runserver 0.0.0.0:8000     # local (non-docker) dev
```

**Next.js (run inside frontend container, or via `docker-compose exec frontend`)**
```bash
npm run dev            # local dev server (localhost:3000)
npm run build           # production build
npm run start            # run production build
npm run lint              # ESLint
npx jest                   # run Jest test suite
npx jest --watch             # watch mode
npx jest --coverage           # coverage report
```

---

## 2. FRONTEND ARCHITECTURE PLAN (Next.js 14 + Tailwind)

### 2.1 Directory Map (`frontend/src/`)

```
src/
├── app/
│   ├── layout.tsx                     # root layout, global styles/providers
│   ├── globals.css                    # Tailwind entrypoint + design tokens (colocated with
│   │                                   #   app/, not a separate styles/ dir)
│   ├── page.tsx                       # "/" — Landing Page
│   ├── report/
│   │   └── page.tsx                   # "/report" — Incident Reporting Page
│   ├── tickets/
│   │   └── [token]/
│   │       └── page.tsx               # "/tickets/[token]" — Ticket Status Page
│   ├── track/
│   │   ├── page.tsx                   # "/track" — email/ticket-ID/link entry
│   │   └── [verifyToken]/
│   │       └── page.tsx               # "/track/[verifyToken]" — read-only list of every
│   │                                   #   ticket for the verified email
│   └── admin/
│       ├── layout.tsx                 # admin shell (nav, auth guard)
│       ├── login/
│       │   └── page.tsx               # "/admin/login" — admin sign-in; unauthenticated
│       │                               #   visits to any other /admin/* route redirect here
│       ├── dashboard/
│       │   └── page.tsx               # "/admin/dashboard" — tabbed Ticket List / Analytics
│       └── tickets/
│           └── [id]/
│               └── page.tsx           # "/admin/tickets/[id]" — Admin Ticket Detail
│
├── components/
│   ├── ui/                            # generic building blocks (Button, Badge, Modal, Input, Table)
│   ├── landing/
│   │   ├── NavBar.tsx                 # Home / Report Issue / Track Ticket + Admin Login
│   │   ├── Hero.tsx
│   │   ├── HowItWorks.tsx
│   │   ├── Features.tsx
│   │   └── Footer.tsx
│   ├── report/
│   │   ├── IncidentForm.tsx           # RHF + Zod form
│   │   └── AttachmentUploader.tsx
│   ├── track/
│   │   ├── TrackEntryForm.tsx         # email, ticket ID, or ticket link — see 2.2
│   │   ├── TrackedTicketsView.tsx     # resolves a verify token, shows the list or an
│   │   │                               #   expired/invalid state
│   │   └── TrackedTicketsTable.tsx    # read-only — StatusBadge/PriorityBadge, no quick-edit;
│   │                                   #   rows link to "/tickets/[token]"
│   ├── ticket-status/
│   │   ├── StatusBadge.tsx
│   │   ├── PriorityBadge.tsx
│   │   ├── TicketTimeline.tsx
│   │   ├── ResponseThread.tsx
│   │   ├── AttachmentsList.tsx        # ticket-level attachments (report-form uploads) — lives
│   │   │                               #   here, not under admin/, because both the public
│   │   │                               #   Ticket Status Page and the admin detail page render it
│   │   └── ResponseAttachmentChips.tsx # compact per-reply attachment chips, shared by
│   │                                   #   MessageThread (admin) and ResponseThread (public)
│   ├── admin/
│   │   ├── DashboardTabs.tsx          # "Ticket List" / "Analytics" tab switcher
│   │   ├── TicketTable.tsx            # rows link to "/admin/tickets/[id]"
│   │   ├── TicketFilters.tsx
│   │   ├── Pagination.tsx             # Prev/Next + "Page N of M"; reads/writes its own
│   │   │                               #   `?page=` param, same self-contained pattern as
│   │   │                               #   TicketFilters; hidden when everything fits on one page
│   │   ├── QuickEditControls.tsx      # inline priority/status editors (dashboard table)
│   │   └── ticket-detail/
│   │       ├── StatusUpdatePanel.tsx  # status select + explicit "Update status" button
│   │       ├── PrioritySelect.tsx     # applies immediately, no confirm step
│   │       ├── ClientDetailsCard.tsx
│   │       ├── MessageThread.tsx      # Admin vs Client bubbles, "self" aligned right
│   │       └── AdminReplyForm.tsx     # textarea + attach files + notify-client toggle
│   └── analytics/
│       ├── MetricCard.tsx             # Total Tickets / Avg Resolution Time / Open vs Closed
│       ├── StatusDistributionChart.tsx
│       └── ResolutionVelocityChart.tsx
│
├── lib/
│   ├── api/
│   │   ├── client.ts                  # fetch wrapper: credentials:"include" + X-CSRFToken
│   │   │                               #   from the csrftoken cookie on unsafe methods; throws
│   │   │                               #   ApiError, returns null on 404/204. All requests go
│   │   │                               #   straight to the Django backend — lib/mock/ is gone.
│   │   ├── mappers.ts                  # snake_case backend JSON -> camelCase frontend types;
│   │   │                               #   also fills fields a given serializer omits (e.g. the
│   │   │                               #   admin *list* serializer skips description/attachments)
│   │   │                               #   with safe defaults unused by that view.
│   │   ├── auth.ts                    # admin login/logout/session-check
│   │   ├── tickets.ts                 # public ticket endpoints (create, get-by-token)
│   │   ├── admin.ts                   # admin ticket + response endpoints
│   │   └── analytics.ts               # analytics endpoints
│   ├── validation/
│   │   ├── incidentSchema.ts          # Zod schema for report form
│   │   └── responseSchema.ts          # Zod schema for admin response form
│   ├── ticket-meta.ts                 # shared status/priority order + badge colors
│   ├── format.ts                      # date/duration formatting helpers
│   └── types/
│       ├── ticket.ts                  # Ticket, Response, Client TS types (mirror backend serializers)
│       └── analytics.ts
│
└── hooks/
    ├── useTicket.ts                   # fetch + poll a single ticket by token
    ├── useTicketList.ts               # admin table data + filters
    └── useAnalytics.ts
```

### 2.2 Component Specification & State Management

**General approach:** server components for initial data fetch (SSR by token /
by filters), client components for interactive forms and polling. Local UI
state via `useState`/`useReducer`; no global store needed at this scale — admin
filter state can live in the URL (`searchParams`) so views are shareable/
bookmarkable.

#### Landing Page (`/`)
- **Components:** `NavBar`, `Hero`, `HowItWorks`, `Features`, `Footer`.
- **Nav:** Home, Report Issue (→ `/report`), Track Ticket (→ `/track`), and a
  de-emphasized Admin Login (→ `/admin/login`) — repeated in the footer.
- **Hero:** states the core pitch plainly — "Report incidents instantly. No
  account registration required." — plus a one-line explanation of the
  token-link model.
- **Two primary action cards** side by side below the hero, both simple CTAs
  (copy + button) rather than embedded forms — the actual interaction lives
  on the destination page, not duplicated here:
  1. **Report an Incident** — links to `/report`.
  2. **Track Your Ticket** — links to `/track` (see below).
- **How it works:** a lightweight 3-step strip (Report → Get your link →
  Track & reply) reusing the same step/connector visual language as the
  Ticket Status Page's timeline, for consistency across the product.
- **Feature highlights:** three columns — instant email notifications, direct
  token link access, real-time status tracking.

#### Track Ticket Page (`/track`, `/track/[verifyToken]`)
- **Components:** `TrackEntryForm`, `TrackedTicketsView`, `TrackedTicketsTable`.
- **Entry (`/track`):** one input accepting an email, a bare ticket ID, or a
  full ticket link (e.g. pasted straight from the confirmation email) — same
  parsing either way, extracting a token out of a URL if one was pasted.
  Behavior differs by what was entered, and this distinction matters for
  privacy (see 3.3):
  - **Looks like a token (bare, or extracted from a pasted URL):** resolve
    straight to `/tickets/[token]` — the token is itself the credential.
  - **Looks like an email:** never list or navigate directly. Request a
    one-time verification link via `POST /api/public/tickets/lookup/` and
    show a neutral "check your email" confirmation — the same response
    whether or not that address has any tickets, so this can't be used to
    enumerate who has filed one.
  - **Neither:** inline validation error.
- **Verified list (`/track/[verifyToken]`):** `TrackedTicketsView` resolves
  the token via `GET /api/public/tickets/track/<verify_token>/`; on success,
  `TrackedTicketsTable` lists every ticket for that email — visually similar
  to the admin dashboard's ticket table (same `StatusBadge`/`PriorityBadge`),
  but **read-only**: no quick-edit selects, since this is the client's own
  view, not an admin's. Clicking a row (or its title) navigates to that
  ticket's `/tickets/[token]`. An expired or invalid token shows a "link
  expired, request a new one" state instead of an error.

#### Incident Reporting Page (`/report`)
- **Component:** `IncidentForm.tsx` (client component).
- **Form library:** React Hook Form + Zod resolver (`incidentSchema.ts`).
- **Fields & validation:**
  - `name` — required, string.
  - `email` — required, valid email format.
  - `title` — required, min 5 / max 150 chars.
  - `description` — required, min 20 chars.
  - `attachments` — optional, file list, client-side size/type validation
    (≤5MB, images/pdf/text, ≤5 files) before upload — and the same limits
    re-enforced server-side (`Attachment`, see 3.2), since client-side
    validation on a file upload is UX only, never a security boundary.
- **Submit flow:** `POST /api/public/tickets/` → on success, show confirmation
  screen with the ticket link ("we've also emailed this to you") and a
  copy-to-clipboard action; on failure, surface field-level and top-level
  error messages from the API response.
- **State:** RHF's internal form state; a local `submitStatus` enum
  (`idle | submitting | success | error`) for the request lifecycle.

#### Ticket Status Page (`/tickets/[token]`)
- **Access model:** token in the URL is the only credential — no login. Invalid
  or unknown token renders a clear "ticket not found" state, not a 500.
- **Components:** `StatusBadge`, `PriorityBadge`, `TicketTimeline`, `AttachmentsList`,
  `ResponseThread`, `ReplyBox`.
- **Data:** `useTicket(token)` hook fetches `GET /api/public/tickets/:token/`
  on mount and polls on an interval (e.g. every 30s) or revalidates on window
  focus to approximate "real-time" updates without a websocket layer.
- **Ticket details:** title, description, `StatusBadge`, `PriorityBadge`, and
  the "opened" timestamp are rendered from the fetched `Ticket` at the top of
  the page, followed by `AttachmentsList` for anything the client uploaded
  when filing — this is the client's own copy of what they submitted, shown
  read-only with a "View" link per file.
- **Timeline:** a 3-step tracker (`Open` → `In Progress` → `Resolved`) derived
  from `status` and the timestamp of each status transition, rendered as a
  horizontal stepper (stacked on narrow screens); the current step is
  highlighted, future steps show as pending.
- **Response thread:** chronological list of `Response` objects
  (`created_at` ascending), visually distinguishing `author_type` — e.g.
  client messages right-aligned/accent-tinted, admin messages left-aligned/
  neutral-tinted — so the client can tell their own messages from support's.
  Any files an admin attached to a reply render as compact link chips under
  that message (`ResponseAttachmentChips`) — client replies never carry
  attachments, `ReplyBox` has no attach-file UI.
- **Reply box:** a textarea + submit button pinned under the thread lets the
  client post a new `Response` (`author_type=Client`) directly on their own
  ticket via `POST /api/public/tickets/:token/responses/`; appends optimistically
  on success. Clients can only add responses to their own ticket (token-scoped),
  never change `status`/`priority`.

#### Admin Dashboard (`/admin/dashboard`)
- **Access:** behind the admin auth guard in `app/admin/layout.tsx`.
- **Layout:** a single page with two tabs — **Ticket List** and **Analytics**
  — switched client-side via `DashboardTabs` (no route change; tab state can
  live in a `?tab=` query param so a view is linkable/refreshable). Ticket
  List is the default tab.

**Ticket List tab**
- **Components:** `TicketTable`, `TicketFilters`, `Pagination`, `QuickEditControls`.
- **Filters:** status, priority, free-text search (title/client name/email) —
  reflected in URL query params; `useTicketList` reads `searchParams` and
  calls `GET /api/admin/tickets/?status=&priority=&search=&page=`. A visible
  "Showing X of Y" count and a "Clear filters" action appear whenever a
  filter is active — X is the server-reported count matching the active
  filter (`ListTicketsResult.count`, not just the current page's row count),
  Y is the grand unfiltered total. Changing any filter resets `?page=` back
  to 1 (a stale page number can outlive the filter that made it valid).
- **Pagination:** `Pagination` renders Prev/Next + "Page N of M" below the
  table, reading/writing its own `?page=` param the same self-contained way
  `TicketFilters` owns status/priority/search; hidden entirely when the
  filtered set fits on one page (`PAGE_SIZE=20`).
- **Quick-edit:** inline pill-styled `<select>` per row for `status` and for
  `priority`, colored to match the corresponding badge; changing either fires
  `PATCH /api/admin/tickets/:id/` optimistically, rolling back on error.
  Setting `status` to `Resolved` is what stamps `resolvedAt` server-side (used
  for the resolution-time analytics below).
- **Row click:** navigates to `/admin/tickets/[id]` (the full detail view,
  below) rather than opening an inline drawer — a ticket's description,
  attachments, and full reply thread need more room than a slide-over gives.

#### Admin Ticket Detail (`/admin/tickets/[id]`)
- **Access:** same admin auth guard; `[id]` is the internal numeric/UUID
  `Ticket.id` (never the public `token`).
- **Header bar:** "← Back to Dashboard" (→ `/admin/dashboard`), `Ticket #<id>`,
  the ticket title, and `StatusBadge` + `PriorityBadge`.
- **Sidebar — Quick actions:**
  - `StatusUpdatePanel`: a `status` select plus an explicit **Update status**
    button (not auto-applied on change) — deliberately not instant, since
    committing it fires the client-notification email (see 3.5); the UI notes
    this directly ("Changing status emails the client automatically").
  - `PrioritySelect`: applies immediately on change, same as the dashboard's
    quick-edit — priority changes don't trigger any notification, so there's
    no need for a confirm step.
  - `ClientDetailsCard`: client name, email, full `token` (monospace, with
    copy-to-clipboard), and the ticket's created timestamp.
- **Main workspace:**
  - `Description` block, plus an `AttachmentsList` for any files the client
    uploaded when filing.
  - `MessageThread`: the full `Response` history, `created_at` ascending,
    bubble-aligned relative to the viewer — the logged-in admin's own replies
    align right ("You"), the client's align left — the mirror image of the
    public Ticket Status Page, where the client sees their own messages on
    the right instead. Reply attachments render via `ResponseAttachmentChips`,
    same shared component the public thread uses.
  - `AdminReplyForm`: a textarea, an "Attach files" control, and an
    **Auto-notify client via email** checkbox (checked by default) — lets an
    admin post several quick internal-facing replies without emailing the
    client on every single one, only notifying when they choose to. Submits
    via `POST /api/admin/tickets/:id/responses/` with `notify_client` in the
    body (see 3.4/3.5).

**Analytics tab**
- **Metric cards:** `MetricCard` × 3 — **Total Tickets**, **Avg. Resolution
  Time** (mean of `resolvedAt - createdAt` over resolved tickets, formatted
  in hours/days), and **Open vs. Closed ratio** (with an inline stacked
  progress bar).
- **Charts:** `StatusDistributionChart` (ticket count per status) and
  `ResolutionVelocityChart` (days-to-close per resolved ticket, chronological)
  — simple bar charts driven directly off the same ticket list response, no
  chart library required for MVP; swap in something like `recharts` later
  only if chart needs grow past bars.
- **Data:** `useAnalytics()` calls `GET /api/admin/analytics/summary/` once
  per tab activation (not polled — analytics are not real-time-critical).

---

## 3. BACKEND ARCHITECTURE PLAN (Django 5.1 DRF + PostgreSQL)

### 3.1 Apps

- `apps/tickets/` — `Client`, `Ticket`, `Response` models, serializers,
  views/viewsets, signals, permissions.
- `apps/analytics/` — read-only aggregation views over `apps.tickets` models
  (no new tables; uses Django ORM aggregation, `annotate`/`aggregate`).

### 3.2 Database Schema

**`Client`**
| field | type | notes |
|---|---|---|
| `id` | UUID (PK) | default `uuid4` |
| `name` | CharField(150) | required — not in the original schema draft; added once the report form (which always collects a name) and the admin `ClientDetailsCard` (which displays one) made the gap concrete. A returning client's most recently submitted name overwrites the stored one. |
| `email` | EmailField | indexed; not unique alone — a client may not need a distinct row per email if we key strictly by ticket token (decide: either one `Client` row per submission, or dedupe by email — default to **dedupe by email** so a returning client's tickets can be looked up by email + token together) |
| `token` | UUID | unique, indexed, `default=uuid4` — used for the client-facing access link |
| `created_at` | DateTimeField | `auto_now_add=True` |

**`Ticket`**
| field | type | notes |
|---|---|---|
| `id` | UUID (PK) | default `uuid4` |
| `client` | FK → `Client` | `on_delete=CASCADE`, `related_name="tickets"` |
| `token` | UUID | unique, indexed, `default=uuid4` — this is the value embedded in `/tickets/[token]`; distinct from the client's own token so each ticket is independently shareable/linkable |
| `title` | CharField(150) | required |
| `description` | TextField | required |
| `priority` | CharField w/ choices | `Low` / `Medium` / `High`, default `Medium` |
| `status` | CharField w/ choices | `Open` / `In Progress` / `Resolved`, default `Open` |
| `created_at` | DateTimeField | `auto_now_add=True` |
| `updated_at` | DateTimeField | `auto_now=True` |
| `resolved_at` | DateTimeField, nullable | Set once, the moment `status` first transitions to `Resolved` (not touched again after, even if `status` later changes) — kept distinct from `updated_at` so a later priority/status edit on an already-resolved ticket can't quietly corrupt the resolution-time analytics. Cleared back to `null` if `status` moves away from `Resolved`. |

**`Response`**
| field | type | notes |
|---|---|---|
| `id` | UUID (PK) | default `uuid4` |
| `ticket` | FK → `Ticket` | `on_delete=CASCADE`, `related_name="responses"` |
| `author_type` | CharField w/ choices | `Admin` / `Client` |
| `message` | TextField | required |
| `created_at` | DateTimeField | `auto_now_add=True` |

**`Attachment`**
| field | type | notes |
|---|---|---|
| `id` | UUID (PK) | default `uuid4` |
| `ticket` | FK → `Ticket`, nullable | set for a file attached at ticket creation (report form) |
| `response` | FK → `Response`, nullable | set for a file attached to a reply (admin only — the client's `ReplyBox` has no attach UI) |
| `file` | FileField | `upload_to=attachment_upload_path` → `media/attachments/<ticket_or_response_id>/<uuid>_<filename>`; served from local disk in dev (`MEDIA_ROOT`/`MEDIA_URL`, Django's dev-only `static()` helper) — swap the storage backend for S3/GCS at deployment, no model change needed |
| `original_name`, `size`, `content_type` | CharField / PositiveIntegerField / CharField | cached off the upload at write time so listing doesn't need to hit storage |
| `created_at` | DateTimeField | `auto_now_add=True` |

Exactly one of `ticket`/`response` is set per row — enforced in the serializers
that create these (`apps/tickets/serializers.py`: `validate_attachment_files`
+ `create_attachments`), not a DB-level `CheckConstraint`, since duplicating
the same rule at both layers buys nothing at this scale. Server-side limits
(never just client-side): ≤5MB per file, ≤5 files per request, content-type
allowlist (`png`/`jpeg`/`gif`/`pdf`/`text/plain`/`csv`) — see
`settings.ATTACHMENT_*`. Unrestricted upload size/type is a real risk
(disk exhaustion, arbitrary file upload), so these are enforced in
`TicketCreateSerializer`/`AdminResponseCreateSerializer` regardless of what
the frontend's `AttachmentUploader` already blocks client-side.

Indices: `Ticket.token`, `Client.token`, `Client.email`, `Ticket.status`,
`Ticket.priority` (filter/sort targets for the admin dashboard and analytics).

### 3.3 Non-Login Access Logic

- On ticket creation, the backend either finds-or-creates a `Client` by email
  and always creates a new `Ticket` with its own `token = uuid4()`.
- The `Ticket.token` (not the `Client.token`) is what the client-facing
  "Ticket Status Page" uses — this keeps one leaked link scoped to one ticket,
  not a client's entire history.
- Public endpoints resolve tickets **only** by `token`, never by numeric/
  sequential ID, and never expose a listing endpoint that enumerates tickets
  without a token.
- Tokens are UUIDv4 — not guessable, not sequential. No expiry in MVP; revisit
  if the brief requires link expiration later.
- The `/track` lookup accepts a token (bare, or extracted from a pasted
  ticket URL), or an email — the two must behave asymmetrically. A token is
  itself the credential, so a valid one may resolve straight to
  `/tickets/<token>`. An email is **not** a credential:
  - It must never directly return, list, or confirm which tickets exist for
    that address — that would let anyone enumerate a stranger's tickets by
    trying emails. `POST /api/public/tickets/lookup/` always returns the same
    generic response regardless of whether the address has any tickets.
  - Instead, it emails a **one-time verification link** —
    `/track/<verify_token>` — that only the inbox owner can open. Visiting it
    calls `GET /api/public/tickets/track/<verify_token>/`, which resolves the
    token server-side to an email and returns every ticket filed under it.
    The verify token is short-lived (15 min) and single-purpose: it only ever
    resolves to an email address, never doubles as a login session.
  - Implementation note: this doesn't need a full model — a signed,
    timestamped token (`django.core.signing.TimestampSigner` wrapping the
    email) is enough. **Use a URL-safe `sep`** when constructing the signer
    (`TimestampSigner(salt=..., sep=".")`) instead of the library default
    `sep=":"` — a real browser click-through percent-encodes a literal `:`
    in a path segment, and since the frontend also runs `encodeURIComponent`
    on the token, the default separator arrives double-encoded (`%253A`) and
    never verifies. This only surfaces when the link is actually clicked in
    a browser — a `Client.get()`/unit-style test against `dumps()`/`loads()`
    directly won't catch it, which is exactly how it slipped through the
    first pass here.

### 3.4 API Endpoint Contracts

**Public (token-based, no login) — prefix `/api/public/`**
| Method | Path | Purpose |
|---|---|---|
| POST | `/api/public/tickets/` | Create a ticket (name, email, title, description, attachments). JSON or `multipart/form-data` — multipart only needed when `attachments` files are present; the frontend switches automatically (`lib/api/tickets.ts`). Returns the full ticket incl. `token` and its (now-real) `attachments`. Triggers confirmation email. |
| GET | `/api/public/tickets/<token>/` | Fetch one ticket + its responses, by token. 404 if token invalid. |
| POST | `/api/public/tickets/<token>/responses/` | Client reply: add a `Response` with `author_type=Client` to their own ticket, resolved by token (never by id/login). Triggers a notification email to the admin(s) watching the ticket. |
| POST | `/api/public/tickets/lookup/` | `/track` entry lookup. Body: `{ query }`. If `query` matches a `Ticket.token` (bare or extracted from a pasted ticket URL), returns `{ redirect: "/tickets/<token>" }`. Otherwise (treated as an email) always returns the same generic `{ status: "ok" }` and emails a one-time link to `/track/<verify_token>` — never confirms existence or returns ticket data in the response itself. |
| GET | `/api/public/tickets/track/<verify_token>/` | Resolves a verification token to its email (404/expired if invalid or past 15 min) and returns every `Ticket` filed under that email — title, token, status, priority, `created_at`. This is the only public endpoint that returns more than one ticket at a time, which is exactly why it's gated behind the verify token rather than a bare query param. |

**Admin auth — prefix `/api/admin/auth/`** (unauthenticated)
| Method | Path | Purpose |
|---|---|---|
| POST | `/api/admin/auth/login/` | Body: `{ email, password }`. Sets the session cookie on success (see auth note below); `400`/`401` with a generic "Incorrect email or password" on failure — never reveal whether the email exists. |
| POST | `/api/admin/auth/logout/` | Clears the session. |
| GET | `/api/admin/auth/session/` | Returns the logged-in admin's `{ email, name }`, or 401/403 if there's no valid session. The session cookie is httponly, so the frontend can't just read it client-side to decide whether to show the dashboard or redirect to login — `AdminLayout` calls this on every `/admin/*` mount instead. |

**Admin (authenticated) — prefix `/api/admin/`**
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/admin/tickets/` | List tickets; supports `?status=`, `?priority=`, `?search=`, `?page=`. DRF `PageNumberPagination`, `PAGE_SIZE=20` (`REST_FRAMEWORK` in settings) — response is `{ count, next, previous, results }`; the frontend's `Pagination` component reads `count` and duplicates `PAGE_SIZE` as `ADMIN_PAGE_SIZE` (`lib/api/admin.ts`) since there's no endpoint that reports it. |
| GET | `/api/admin/tickets/<id>/` | Retrieve one ticket (by internal id) with full response history. |
| PATCH | `/api/admin/tickets/<id>/` | Update `status` and/or `priority` (quick-edit). Triggers status-change signal if `status` changed. |
| POST | `/api/admin/tickets/<id>/responses/` | Add an admin response/comment to a ticket. JSON or multipart (same auto-switch as ticket creation, whenever files are attached). Body: `{ message, notify_client?, attachments? }` (`notify_client` defaults `true`). Triggers the client-notification email only when `notify_client` is true, so an admin can post several replies and only notify on the last. |
| GET | `/api/admin/analytics/summary/` | Aggregate counts: by status, by priority, open-vs-closed, avg/median resolution time. |

Auth for `/api/admin/*`: DRF `SessionAuthentication` — `POST
/api/admin/auth/login/` looks up a Django `auth.User` by `email` (must have
`is_staff=True`), calls `authenticate()`/`login()` on match, and forces a
`csrftoken` cookie onto the response via `get_token(request)`. Every
subsequent unsafe request (`PATCH`/`POST` under `/api/admin/`) must echo that
cookie's value back as an `X-CSRFToken` header — DRF's `SessionAuthentication`
enforces Django's normal CSRF protection, and an API-only SPA has no
server-rendered form to source the token from otherwise. `IsAdminUser` (in
`apps/tickets/permissions.py`) gates every admin view on `is_staff`; this is
intentionally distinct from the client token scheme and never accepts a
`Ticket.token` as credential. `python manage.py seed_demo_data` creates a demo
admin (`admin@example.com` / `admin12345`) and a few demo tickets for local
dev.

### 3.5 Email Notification Flow

- Django **signal** (`post_save` on `Ticket`, and a dedicated signal/hook on
  `Response` creation) drives all outbound email:
  1. **On `Ticket` creation:** send the client an email containing the direct
     link `https://<frontend-host>/tickets/<token>/`.
  2. **On `Ticket.status` change** (compare old vs. new value inside the
     `pre_save`/`post_save` handler, or via a service function called from the
     `PATCH` view): send the client an email noting the new status, with the
     same ticket link.
  3. **On new `Response` with `author_type=Admin`:** email the client that a
     new response was posted, with the ticket link — unless the admin sent it
     with `notify_client=false` (see 3.4), e.g. while posting several quick
     replies in a row and only wanting the last one to notify.
  4. **On new `Response` with `author_type=Client`:** notify the admin(s)
     (e.g. `settings.ADMIN_NOTIFICATION_EMAILS`, or whoever the ticket is
     assigned to once assignment exists) that the client replied, linking to
     the admin ticket view.
  5. **On `POST /api/public/tickets/lookup/` with an email:** send that
     address the one-time `/track/<verify_token>` link (see 3.3) — sent
     unconditionally, whether or not the address has any tickets, so the
     email itself can't be used to infer that either way.
- Implementation: Django's built-in `django.core.mail.send_mail`, backed by
  console backend in dev and SMTP (or a provider) in deployment, configured via
  env vars — no email content templates committed with real credentials.
- Keep email-sending logic in a small `apps/tickets/services.py` (or
  `notifications.py`) module, called from signal receivers, so it's testable
  independent of Django's signal dispatch machinery.
