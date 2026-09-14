import Link from "next/link";
import { ActionCard } from "@/components/landing/ActionCard";
import { TicketLookupCard } from "@/components/landing/TicketLookupCard";
import { IconArrowRight, IconPlus } from "@/components/ui/icons";

export function ActionCards() {
  return (
    <section id="track" className="relative z-10 mx-auto -mt-8 w-full max-w-6xl px-4 pb-4 sm:px-6 md:-mt-12">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <ActionCard icon={<IconPlus />} eyebrow="Something's wrong" title="Report an incident">
          <p className="mb-5 flex-1 text-sm text-[var(--muted)]">
            Fill in a few details about the issue and who to reach — takes about a minute, no
            account needed.
          </p>
          <Link
            href="/report"
            className="btn-focus inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--accent)] py-2.5 text-sm font-semibold text-[var(--accent-ink)]"
          >
            Report an incident <IconArrowRight />
          </Link>
        </ActionCard>
        <TicketLookupCard />
      </div>
    </section>
  );
}
