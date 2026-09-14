import type { ComponentType, SVGProps } from "react";
import { IconLink, IconMail, IconPulse } from "@/components/ui/icons";

const FEATURES: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  body: string;
}[] = [
  {
    icon: IconMail,
    title: "Instant email notifications",
    body: "The moment your ticket is filed, escalated, or resolved, we email you — with the tracking link right there.",
  },
  {
    icon: IconLink,
    title: "Direct token link access",
    body: "Every ticket gets its own private, unguessable link. Bookmark it, forward it, reopen it any time — no password.",
  },
  {
    icon: IconPulse,
    title: "Real-time status tracking",
    body: "Watch your ticket move from Open to In Progress to Resolved, and see replies from our team as they're posted.",
  },
];

export function Features() {
  return (
    <section className="border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 md:py-20">
        <div className="mb-10 max-w-lg">
          <h2 className="font-display mb-2 text-2xl font-extrabold text-[var(--ink)]">
            Built for no-login support
          </h2>
          <p className="text-sm text-[var(--muted)]">
            Everything about the flow is designed around one idea: your link is your login.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title}>
              <span
                aria-hidden="true"
                className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]"
              >
                <Icon />
              </span>
              <h3 className="mb-1.5 text-base font-semibold text-[var(--ink)]">{title}</h3>
              <p className="text-sm leading-relaxed text-[var(--muted)]">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
