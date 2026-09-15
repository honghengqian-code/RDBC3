# CLAUDE.md — Ticket Management System

Source of truth for this project's architecture. Read before working here; update in the same change when reality deviates from this doc.

## 1. Overview

Incident ticket system with **no client accounts** — a client is identified only by a unique token emailed to them on ticket creation. Admins log in normally (Django session auth); clients never do.

- **Frontend:** Next.js 14 (App Router) + Tailwind CSS
- **Backend:** Django 5.1 + DRF
- **DB:** PostgreSQL
- **Infra:** Docker + docker-compose

User stories: client files a ticket and gets a tracking link with no signup · admin updates status/replies to keep the client informed · admin views volume/resolution-time analytics.

## 2. Monorepo Layout

```
/RDBC3
├── docker-compose.yml / docker-compose.override.yml   # base + dev overrides (hot reload, volumes)
├── frontend/            Next.js 14 App Router (see §4)
│   ├── Dockerfile, package.json, .env.local.example
│   └── src/{app,components,lib,hooks}/
└── backend/             Django 5.1 + DRF (see §5)
    ├── Dockerfile, manage.py, requirements.txt, .env.example
    ├── config/           settings, urls
    └── apps/{tickets,analytics}/
```

## 3. Coding Guidelines

- TypeScript strict on frontend; Python type hints on backend models/serializers/views.
- Prettier + ESLint (frontend), Black + Ruff (backend).
- REST resources are plural nouns; React components PascalCase; hooks `useX`.
- No dead code / speculative abstraction — build only what the current page/endpoint needs.
- Never commit `.env`; `.env.example` documents required vars for both apps.
- Tests colocated (`__tests__/` frontend, `tests.py` per Django app). Target ≥70% coverage on critical paths: ticket creation, token access, status updates.
- **Error handling & logging** — anything touching network/DB/filesystem/another service must not fail silently:
  - Backend: module-level `logger = logging.getLogger(__name__)`; `logger.info` on lifecycle events (created, status changed, email sent/failed), `logger.exception` inside `except`. Log ids/tokens, never raw PII. Console logging in dev via `LOGGING` in settings.
  - Frontend: wrap API calls in `try/catch`, pair user-facing error state with `console.error(error, context)`; `console.info` on key success paths. Never leave an unhandled rejected promise.
  - Scope to functions where failure/success actually matters — signal, not noise.

## 4. Git Workflow

`main` always deployable · `feature/<name>` branches, PR into `main` · imperative commit messages · never force-push shared branches or rewrite `main`.

## 5. CLI Cheat Sheet

```bash
# Docker
docker-compose up --build | up -d | down | logs -f backend | exec backend bash

# Django (in backend container)
python manage.py makemigrations / migrate / createsuperuser / shell
python manage.py test [apps.tickets]
python manage.py seed_demo_data          # demo admin (admin@example.com / admin12345) + tickets
python manage.py runserver 0.0.0.0:8000
python manage.py changepassword <username>   # reset an existing admin's password — don't
                                              # re-run createsuperuser with the same email
                                              # (auth.User.email isn't unique; see §10)

# Next.js (in frontend container)
npm run dev | build | start | lint
npx jest [--watch|--coverage]
```

## 6. Frontend (`frontend/src/`)

**Routes (`app/`):** `/` landing · `/report` incident form · `/tickets/[token]` client status page · `/track` + `/track/[verifyToken]` email/ID lookup → verified ticket list · `/admin/login`, `/admin/dashboard` (tabbed List/Analytics), `/admin/tickets/[id]` (behind `app/admin/layout.tsx` auth guard).

**Components, by area:**
- `landing/` — NavBar, Hero, HowItWorks, Features, Footer.
- `report/` — `IncidentForm` (RHF + Zod, `incidentSchema.ts`), `AttachmentUploader` (client-side ≤5MB/≤5 files/type check, mirrored server-side).
- `track/` — `TrackEntryForm` (parses input as token/URL/email — see §9), `TrackedTicketsView`, `TrackedTicketsTable` (read-only, no quick-edit).
- `ticket-status/` (shared by public + admin) — `StatusBadge`, `PriorityBadge`, `TicketTimeline`, `ResponseThread`, `AttachmentsList`, `ResponseAttachmentChips`.
- `admin/` — `DashboardTabs`, `TicketFilters`, `Pagination` (both own their URL query params directly), `QuickEditControls`; `TicketListPanel` owns row selection (per-page, resets on filter/page change) and the delete-selected action bar, passed down into `TicketTable` (header select-all checkbox + per-row checkboxes, indeterminate when some but not all of the current page is selected); `ticket-detail/`: `StatusUpdatePanel` (explicit "Update status" button — not instant, since it emails the client), `PrioritySelect` (applies immediately, no email), `ClientDetailsCard`, `MessageThread`, `AdminReplyForm` (message + files + notify-client toggle).
- `analytics/` — `MetricCard` ×3, `StatusDistributionChart`, `ResolutionVelocityChart` (plain bars, no chart lib needed at this scale).

**`lib/`:** `api/client.ts` fetch wrapper (`credentials:"include"`, `X-CSRFToken` from the `csrftoken` cookie on unsafe methods, throws `ApiError`, `null` on 404/204) · `api/mappers.ts` (backend snake_case → frontend camelCase) · `api/{auth,tickets,admin,analytics}.ts` · `validation/*Schema.ts` (Zod) · `ticket-meta.ts`, `format.ts` · `types/ticket.ts`, `types/analytics.ts`.

**`hooks/`:** `useTicket` (poll by token, 30s / on focus) · `useTicketList` (reads filter+page from `searchParams`, calls the admin list endpoint) · `useTicketDetail` · `useAnalytics` (fetch per tab activation, not polled).

**Key UI rules:**
- Admin dashboard filters (status/priority/search) and page number live in the URL; changing a filter resets `page` to 1. "Showing X of Y" — X = server count matching filters, Y = grand total.
- Quick-edit (dashboard row `<select>`s) PATCHes optimistically, rolls back on error.
- Admin ticket detail: status change requires the explicit "Update status" button (fires client email); priority applies instantly (no email).
- Client `ReplyBox` has no attach-file UI — only admins can attach files to a reply.

## 7. Backend Apps

- `apps/tickets/` — `Client`, `Ticket`, `Response`, `Attachment` models; serializers, views, signals, permissions, `services.py` (email + track-verification signing).
- `apps/analytics/` — read-only ORM aggregation over `apps.tickets`, no new tables.

## 8. Database Schema

**`Client`**
| field | type | notes |
|---|---|---|
| `id` | UUID PK | `default=uuid4` |
| `name` | CharField(150) | latest submitted name wins on repeat tickets |
| `email` | EmailField, indexed | deduped by email (not unique — see token model below) |
| `token` | UUID, unique | client-facing access token |
| `created_at` | DateTime | `auto_now_add` |

**`Ticket`**
| field | type | notes |
|---|---|---|
| `id` | UUID PK | internal id — admin-only, never public |
| `client` | FK → Client | `CASCADE`, `related_name="tickets"` |
| `token` | UUID, unique | **the** public credential; distinct from `Client.token` so one leaked link scopes to one ticket |
| `title` | CharField(150) | required |
| `description` | TextField | required |
| `priority` | choices | `Low`/`Medium`/`High`, default `Medium` |
| `status` | choices | `Open`/`In Progress`/`Resolved`, default `Open` |
| `created_at` / `updated_at` | DateTime | auto |
| `resolved_at` | DateTime, null | set once on first transition to `Resolved`; cleared if status leaves `Resolved`; distinct from `updated_at` so later edits don't corrupt resolution-time analytics |

**`Response`**
| field | type | notes |
|---|---|---|
| `id` | UUID PK | |
| `ticket` | FK → Ticket | `CASCADE`, `related_name="responses"` |
| `author_type` | choices | `Admin`/`Client` |
| `message` | TextField | required |
| `created_at` | DateTime | ordering field |

**`Attachment`**
| field | type | notes |
|---|---|---|
| `id` | UUID PK | |
| `ticket` | FK, null | set for report-form uploads |
| `response` | FK, null | set for admin-reply uploads (exactly one of ticket/response is ever set, enforced in serializers) |
| `file` | FileField | `media/attachments/<owner_id>/<uuid>_<filename>`; local disk in dev, swap storage backend for S3/GCS in prod |
| `original_name`, `size`, `content_type` | cached at upload time so listing doesn't hit storage |
| `created_at` | DateTime | |

Server-side limits (never trust client-side only): ≤5MB/file, ≤5 files/request, content-type allowlist (png/jpeg/gif/pdf/text/csv) — `settings.ATTACHMENT_*`.

Indices: `Ticket.token`, `Client.token`, `Client.email`, `Ticket.status`, `Ticket.priority`.

## 9. Non-Login Access & Security Rules

- Ticket creation: find-or-create `Client` by email, always create a new `Ticket` with its own `token`.
- Public endpoints resolve **only** by token, never by sequential id; no endpoint enumerates tickets without one.
- Tokens are UUIDv4 (unguessable), no expiry in MVP.
- `/track` lookup: a token-shaped input (bare or extracted from a pasted URL) resolves straight to `/tickets/<token>`. An **email is never a credential** — `POST /api/public/tickets/lookup/` always returns the identical generic response regardless of whether the address has any tickets (anti-enumeration), and instead emails a one-time signed link `/track/<verify_token>` (15 min TTL, `TimestampSigner`, resolves only to an email, never a session).
  - Use a URL-safe signer separator (`sep="."`, not the default `":"`) — a real browser click-through percent-encodes a literal colon in a path segment, and the frontend's `encodeURIComponent` double-encodes it again, so the default separator never verifies. Only surfaces on an actual clicked link, not a unit test against `dumps()`/`loads()` directly.
- Admin auth is fully separate from the client token scheme — a `Ticket.token` must never work as an admin credential.

## 10. API Endpoints

**Public — `/api/public/`**
| Method | Path | Purpose |
|---|---|---|
| POST | `/tickets/` | Create ticket. JSON or multipart (multipart only when files present). Returns full ticket incl. `token` + `attachments`. Sends confirmation email. |
| GET | `/tickets/<token>/` | Fetch ticket + responses by token. 404 if invalid. |
| POST | `/tickets/<token>/responses/` | Client reply (`author_type=Client`), token-scoped. Notifies admin(s). |
| POST | `/tickets/lookup/` | `/track` entry. Body `{query}`. Token match → `{redirect: "/tickets/<token>"}`. Otherwise treated as email → generic `{status:"ok"}` + one-time verify email. |
| GET | `/tickets/track/<verify_token>/` | Resolves verify token → email, returns every ticket for it (title/token/status/priority/created_at). 404 if invalid/expired. |

**Admin auth — `/api/admin/auth/`** (unauthenticated)
| Method | Path | Purpose |
|---|---|---|
| POST | `/login/` | `{email, password}` → session cookie + forces `csrftoken` cookie. Generic 401 on failure. |
| POST | `/logout/` | Clears session. |
| GET | `/session/` | `{email, name}` or 401/403 — session cookie is httponly, so `AdminLayout` asks the server rather than reading it client-side. |

**Admin — `/api/admin/`** (session + `IsAdminUser`, CSRF required on unsafe methods)
| Method | Path | Purpose |
|---|---|---|
| GET | `/tickets/` | `?status=&priority=&search=&page=`. DRF pagination, `PAGE_SIZE=20`, response `{count, next, previous, results}`. |
| GET | `/tickets/<id>/` | Full detail incl. responses, by internal id. |
| PATCH | `/tickets/<id>/` | Update `status`/`priority`; status change fires the notification signal. |
| DELETE | `/tickets/<id>/` | Delete one ticket. Cascades to its responses/attachments (DB) and removes attachment files from storage. |
| POST | `/tickets/bulk-delete/` | `{ids: [...]}` (1-500 UUIDs). Same delete path as above, batched — used for both a single dashboard-selected ticket and mass delete via select-all. Returns `{deleted: n}`; unmatched ids are silently skipped, not an error. |
| POST | `/tickets/<id>/responses/` | Admin reply. JSON or multipart. `{message, notify_client=true, attachments?}` — email sent only when `notify_client` is true. |
| GET | `/analytics/summary/` | Counts by status/priority, open-vs-closed, avg resolution time. |

Admin auth mechanics: `POST /login/` looks up `auth.User` by email (`is_staff=True`), `authenticate()`/`login()`, then `get_token(request)` to set the CSRF cookie. Every subsequent `PATCH`/`POST` under `/api/admin/` must echo that cookie as `X-CSRFToken`.
- `auth.User.email` has no unique constraint (Django's default), so two staff accounts can end up sharing one address — e.g. running `createsuperuser` twice for the same email instead of `changepassword`. The login view queries by email + `is_staff=True` and tries every match against the given password rather than assuming a single row, so a duplicate can't lock out every password for that address the way a plain `.get()` would; it logs a `WARNING` (`Multiple staff users share email=...`) when it happens so the duplicate gets noticed and cleaned up. Prefer `changepassword <username>` over re-running `createsuperuser` to avoid creating one.

## 11. Email Notification Flow

Driven by Django signals (`post_save` on `Ticket`/`Response`), logic lives in `apps/tickets/services.py` so it's testable outside signal dispatch:

| Trigger | Recipient | Content |
|---|---|---|
| Ticket created | client | link to `/tickets/<token>` |
| `Ticket.status` changes | client | new status + same link |
| New `Response` (Admin) | client | unless posted with `notify_client=false` |
| New `Response` (Client) | admin(s) | link to admin ticket view |
| `/tickets/lookup/` with an email | that address | one-time `/track/<verify_token>` link — sent unconditionally so it can't signal whether the address has tickets |

Console email backend in dev; SMTP via env vars in deployment. No credentials committed.
