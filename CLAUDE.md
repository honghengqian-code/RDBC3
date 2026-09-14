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
│   ├── page.tsx                       # "/" — Incident Reporting Page
│   ├── report/
│   │   └── page.tsx                   # "/report" — alt route to reporting form (or redirect from "/")
│   ├── tickets/
│   │   └── [token]/
│   │       └── page.tsx               # "/tickets/[token]" — Ticket Status Page
│   └── admin/
│       ├── layout.tsx                 # admin shell (nav, auth guard)
│       ├── dashboard/
│       │   └── page.tsx               # "/admin/dashboard"
│       └── analytics/
│           └── page.tsx               # "/admin/analytics"
│
├── components/
│   ├── ui/                            # generic building blocks (Button, Badge, Modal, Input, Table)
│   ├── report/
│   │   ├── IncidentForm.tsx           # RHF + Zod form
│   │   └── AttachmentUploader.tsx
│   ├── ticket-status/
│   │   ├── StatusBadge.tsx
│   │   ├── TicketTimeline.tsx
│   │   └── ResponseThread.tsx
│   ├── admin/
│   │   ├── TicketTable.tsx
│   │   ├── TicketFilters.tsx
│   │   ├── QuickEditControls.tsx      # inline priority/status editors
│   │   └── ResponseDrawer.tsx
│   └── analytics/
│       ├── StatusDistributionChart.tsx
│       ├── OpenVsClosedChart.tsx
│       └── ResolutionVelocityChart.tsx
│
├── lib/
│   ├── api/
│   │   ├── client.ts                  # fetch wrapper (base URL, error handling)
│   │   ├── tickets.ts                 # public ticket endpoints (create, get-by-token)
│   │   ├── admin.ts                   # admin ticket + response endpoints
│   │   └── analytics.ts               # analytics endpoints
│   ├── validation/
│   │   ├── incidentSchema.ts          # Zod schema for report form
│   │   └── responseSchema.ts          # Zod schema for admin response form
│   └── types/
│       ├── ticket.ts                  # Ticket, Response, Client TS types (mirror backend serializers)
│       └── analytics.ts
│
├── hooks/
│   ├── useTicket.ts                   # fetch + poll a single ticket by token
│   ├── useTicketList.ts               # admin table data + filters
│   └── useAnalytics.ts
│
└── styles/
    └── globals.css                    # Tailwind entrypoint
```

### 2.2 Component Specification & State Management

**General approach:** server components for initial data fetch (SSR by token /
by filters), client components for interactive forms and polling. Local UI
state via `useState`/`useReducer`; no global store needed at this scale — admin
filter state can live in the URL (`searchParams`) so views are shareable/
bookmarkable.

#### Incident Reporting Page (`/` or `/report`)
- **Component:** `IncidentForm.tsx` (client component).
- **Form library:** React Hook Form + Zod resolver (`incidentSchema.ts`).
- **Fields & validation:**
  - `name` — required, string.
  - `email` — required, valid email format.
  - `title` — required, min 5 / max 150 chars.
  - `description` — required, min 20 chars.
  - `attachments` — optional, file list, client-side size/type validation
    (e.g. ≤5MB, images/pdf/text) before upload.
- **Submit flow:** `POST /api/public/tickets/` → on success, show confirmation
  screen with the ticket link ("we've also emailed this to you") and a
  copy-to-clipboard action; on failure, surface field-level and top-level
  error messages from the API response.
- **State:** RHF's internal form state; a local `submitStatus` enum
  (`idle | submitting | success | error`) for the request lifecycle.

#### Ticket Status Page (`/tickets/[token]`)
- **Access model:** token in the URL is the only credential — no login. Invalid
  or unknown token renders a clear "ticket not found" state, not a 500.
- **Components:** `StatusBadge`, `TicketTimeline`, `ResponseThread`.
- **Data:** `useTicket(token)` hook fetches `GET /api/public/tickets/:token/`
  on mount and polls on an interval (e.g. every 30s) or revalidates on window
  focus to approximate "real-time" updates without a websocket layer.
- **Timeline:** derived from `status` changes and `Response` entries, sorted by
  `created_at`, rendered oldest → newest.
- **Response thread:** read-only list of `Response` objects for the client
  view; clients cannot post responses (post-MVP: optional client reply, not in
  initial scope).

#### Admin Dashboard (`/admin/dashboard`)
- **Access:** behind the admin auth guard in `app/admin/layout.tsx`.
- **Components:** `TicketTable`, `TicketFilters`, `QuickEditControls`,
  `ResponseDrawer`.
- **Filters:** status, priority, date range, free-text search — reflected in
  URL query params; `useTicketList` reads `searchParams` and calls
  `GET /api/admin/tickets/?status=&priority=&search=`.
- **Quick-edit:** inline `<select>`/dropdown per row for `status` and
  `priority` that fires `PATCH /api/admin/tickets/:id/` optimistically, rolling
  back on error.
- **Response drawer:** slide-over panel opened per ticket row; posts to
  `POST /api/admin/tickets/:id/responses/`, which also triggers the backend
  email-notification signal (see 3.5).

#### Analytics View (`/admin/analytics`)
- **Components:** `StatusDistributionChart`, `OpenVsClosedChart`,
  `ResolutionVelocityChart`. Chart library: lightweight option such as
  `recharts` (decide at implementation time; keep it to one library).
- **Data:** `useAnalytics()` calls `GET /api/admin/analytics/summary/` once per
  page load (not polled — analytics are not real-time-critical).
- **Metrics shown:** ticket count by status, ticket count by priority, open vs.
  closed over time, average/median resolution time (time between `Open` and
  `Resolved`).

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

**`Response`**
| field | type | notes |
|---|---|---|
| `id` | UUID (PK) | default `uuid4` |
| `ticket` | FK → `Ticket` | `on_delete=CASCADE`, `related_name="responses"` |
| `author_type` | CharField w/ choices | `Admin` / `Client` |
| `message` | TextField | required |
| `created_at` | DateTimeField | `auto_now_add=True` |

Indices: `Ticket.token`, `Client.token`, `Client.email`, `Ticket.status`,
`Ticket.priority` (filter/sort targets for the admin dashboard and analytics).

Attachments (from the reporting form) are out of scope for the core schema
above — model as a future `Attachment` FK'd to `Ticket` with a `FileField`
storing to a media volume/bucket; not required for MVP schema lock-in.

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

### 3.4 API Endpoint Contracts

**Public (token-based, no login) — prefix `/api/public/`**
| Method | Path | Purpose |
|---|---|---|
| POST | `/api/public/tickets/` | Create a ticket (name, email, title, description, attachments). Returns ticket incl. `token`. Triggers confirmation email. |
| GET | `/api/public/tickets/<token>/` | Fetch one ticket + its responses, by token. 404 if token invalid. |

**Admin (authenticated) — prefix `/api/admin/`**
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/admin/tickets/` | List tickets; supports `?status=`, `?priority=`, `?search=`, pagination. |
| GET | `/api/admin/tickets/<id>/` | Retrieve one ticket (by internal id) with full response history. |
| PATCH | `/api/admin/tickets/<id>/` | Update `status` and/or `priority` (quick-edit). Triggers status-change signal if `status` changed. |
| POST | `/api/admin/tickets/<id>/responses/` | Add an admin response/comment to a ticket. Triggers notification email. |
| GET | `/api/admin/analytics/summary/` | Aggregate counts: by status, by priority, open-vs-closed, avg/median resolution time. |

Auth for `/api/admin/*`: DRF session auth (backed by Django admin login) or
token auth, gated by `IsAdminUser`/`IsAuthenticated` permission classes —
finalize exact mechanism at implementation time, but it must be distinct from
the client token scheme and must never accept a `Ticket.token` as credential.

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
     new response was posted, with the ticket link.
- Implementation: Django's built-in `django.core.mail.send_mail`, backed by
  console backend in dev and SMTP (or a provider) in deployment, configured via
  env vars — no email content templates committed with real credentials.
- Keep email-sending logic in a small `apps/tickets/services.py` (or
  `notifications.py`) module, called from signal receivers, so it's testable
  independent of Django's signal dispatch machinery.
