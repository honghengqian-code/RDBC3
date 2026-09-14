"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { incidentSchema, type IncidentFormValues } from "@/lib/validation/incidentSchema";
import { createTicket } from "@/lib/api/tickets";
import { FormField } from "@/components/ui/FormField";
import { AttachmentUploader, type AttachedFile } from "@/components/report/AttachmentUploader";
import { SuccessPanel } from "@/components/report/SuccessPanel";
import { IconSpinner } from "@/components/ui/icons";

export function IncidentForm() {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<IncidentFormValues>({
    resolver: zodResolver(incidentSchema),
    defaultValues: { name: "", email: "", title: "", description: "" },
  });

  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<{ email: string; link: string } | null>(null);

  const titleValue = watch("title") ?? "";
  const descriptionValue = watch("description") ?? "";

  const onSubmit = async (values: IncidentFormValues) => {
    setSubmitError(null);
    try {
      const ticket = await createTicket({
        ...values,
        attachments: attachments.map((a) => a.file),
      });
      console.info("[IncidentForm] ticket created", { token: ticket.token });
      setResult({ email: values.email, link: ticket.link });
    } catch (error) {
      console.error("[IncidentForm] failed to create ticket", error);
      setSubmitError("Something went wrong submitting your report. Please try again.");
    }
  };

  const resetAll = () => {
    reset();
    setAttachments([]);
    setSubmitError(null);
    setResult(null);
  };

  if (result) {
    return <SuccessPanel email={result.email} link={result.link} onReset={resetAll} />;
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)] sm:p-7">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent)]">
        Public intake · no login required
      </p>
      <h1 className="font-display mb-1.5 text-[1.6rem] font-extrabold leading-tight text-[var(--ink)] sm:text-[1.85rem]">
        Report an incident
      </h1>
      <p className="mb-6 text-sm text-[var(--muted)]">
        Tell us what&apos;s wrong and we&apos;ll email you a private tracking link — no account
        needed.
      </p>

      {submitError && (
        <p className="mb-5 rounded-lg bg-[var(--pri-high-soft)] px-3.5 py-2.5 text-sm text-[var(--err)]">
          {submitError}
        </p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField id="name" label="Name" required error={errors.name?.message}>
            <input
              id="name"
              type="text"
              autoComplete="name"
              placeholder="Ada Lovelace"
              className="field-input"
              aria-invalid={!!errors.name}
              {...register("name")}
            />
          </FormField>
          <FormField id="email" label="Email" required error={errors.email?.message}>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="ada@example.com"
              className="field-input"
              aria-invalid={!!errors.email}
              {...register("email")}
            />
          </FormField>
        </div>

        <FormField
          id="title"
          label="Issue title"
          required
          error={errors.title?.message}
          hint={<span className="tabular-nums">{titleValue.length}/150</span>}
        >
          <input
            id="title"
            type="text"
            maxLength={150}
            placeholder="Checkout page returns a 500 error"
            className="field-input"
            aria-invalid={!!errors.title}
            {...register("title")}
          />
        </FormField>

        <FormField
          id="description"
          label="Description"
          required
          error={errors.description?.message}
          hint={<span className="tabular-nums">{descriptionValue.length}/2000</span>}
        >
          <textarea
            id="description"
            rows={5}
            maxLength={2000}
            placeholder="What happened, when did it start, and what have you already tried?"
            className="field-input resize-y"
            aria-invalid={!!errors.description}
            {...register("description")}
          />
        </FormField>

        <AttachmentUploader files={attachments} onChange={setAttachments} />

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-focus mt-1 flex items-center justify-center gap-2 rounded-lg bg-[var(--accent)] py-2.5 text-sm font-semibold text-[var(--accent-ink)] disabled:opacity-70"
        >
          {isSubmitting && <IconSpinner />}
          {isSubmitting ? "Submitting report…" : "Submit report"}
        </button>
      </form>
    </section>
  );
}
