import { IconMail } from "@/components/ui/icons";

const TICKET_DOMAIN = "helpdesk.example.com";
const EXAMPLE_TOKEN = "d4a1f2b6-9c3a";

function NotificationMockup() {
  return (
    <div className="float-card w-[280px] rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-lg)] sm:w-[310px]">
      <div className="mb-3 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--muted)]">
          <IconMail width={14} height={14} /> Incident Desk
        </span>
        <span className="flex items-center gap-1.5 text-[0.65rem] font-semibold text-[var(--ok)]">
          <span className="pulse-dot" aria-hidden="true" /> Just now
        </span>
      </div>
      <p className="mb-1 text-sm font-semibold text-[var(--ink)]">Your ticket has been opened</p>
      <p className="mb-3 text-xs leading-relaxed text-[var(--muted)]">
        &ldquo;Checkout page returns a 500 error&rdquo; — we&apos;ll email you the moment this
        changes.
      </p>
      <p className="font-mono mb-3 truncate rounded-md bg-[var(--surface-2)] px-2.5 py-2 text-[0.68rem] text-[var(--accent)]">
        {TICKET_DOMAIN}/tickets/{EXAMPLE_TOKEN}…
      </p>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--accent)]">
        <span
          className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent)]"
          aria-hidden="true"
        />
        Open
      </span>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-[var(--border)]">
      <div className="hero-grid absolute inset-0" aria-hidden="true" />
      <div
        className="hero-glow absolute -top-32 right-[-80px] h-[440px] w-[440px] rounded-full"
        aria-hidden="true"
      />
      <div className="relative mx-auto w-full max-w-6xl px-4 pb-16 pt-14 sm:px-6 md:pb-24 md:pt-20">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.1fr_auto] lg:gap-10">
          <div className="max-w-xl">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
              No login · no password · just your ticket
            </p>
            <h1
              className="font-display mb-4 font-extrabold leading-[1.05] text-[var(--ink)]"
              style={{ fontSize: "clamp(2.1rem, 4.4vw, 3.4rem)" }}
            >
              Report incidents instantly.
            </h1>
            <p className="mb-3 text-lg text-[var(--ink)]">
              No account registration required — just a private link, straight to your inbox.
            </p>
            <p className="max-w-md text-sm text-[var(--muted)]">
              Describe what&apos;s wrong, and we&apos;ll hand you a unique tracking link by email.
              No sign-up, no password to remember — just the link, and everything happening on
              your ticket.
            </p>
          </div>
          <div className="hidden lg:block" aria-hidden="true">
            <NotificationMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
