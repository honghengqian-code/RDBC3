import { Fragment } from "react";

const STEPS = [
  {
    title: "Report the issue",
    body: "Tell us what happened — no account needed, just your email.",
  },
  {
    title: "Get your link",
    body: "We email a private tracking link the instant your ticket is filed.",
  },
  {
    title: "Track & reply",
    body: "Follow the status, read updates, and reply — all from that one link.",
  },
] as const;

export function HowItWorks() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 md:py-20">
      <h2 className="font-display mb-8 text-center text-sm font-bold uppercase tracking-[0.1em] text-[var(--muted)]">
        How it works
      </h2>
      <div className="flex flex-col items-start gap-8 sm:flex-row sm:gap-4">
        {STEPS.map((s, i) => (
          <Fragment key={s.title}>
            <div className="mx-auto flex max-w-sm flex-1 items-start gap-3 sm:flex-col sm:items-center sm:text-center">
              <span className="font-display flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-sm font-bold text-[var(--accent)]">
                {i + 1}
              </span>
              <div>
                <h3 className="mb-1 text-sm font-semibold text-[var(--ink)]">{s.title}</h3>
                <p className="text-sm leading-relaxed text-[var(--muted)]">{s.body}</p>
              </div>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className="mt-[18px] hidden h-0.5 flex-1 rounded-full bg-[var(--border)] sm:block"
                aria-hidden="true"
              />
            )}
          </Fragment>
        ))}
      </div>
    </section>
  );
}
