"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormField } from "@/components/ui/FormField";
import { IconSpinner } from "@/components/ui/icons";
import { adminLogin } from "@/lib/mock/admin-auth";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Enter your email address.")
    .email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});
type LoginValues = z.infer<typeof loginSchema>;

export function AdminLoginForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const [loginError, setLoginError] = useState<string | null>(null);

  const onSubmit = async (values: LoginValues) => {
    setLoginError(null);
    try {
      const session = await adminLogin(values.email, values.password);
      console.info("[AdminLoginForm] signed in", { email: session.email });
      router.replace("/admin/dashboard");
    } catch (error) {
      console.error("[AdminLoginForm] login failed", error);
      setLoginError(error instanceof Error ? error.message : "Couldn't sign in. Please try again.");
    }
  };

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)] sm:p-8">
      <h1 className="font-display mb-1.5 text-[1.4rem] font-extrabold text-[var(--ink)]">
        Admin sign in
      </h1>
      <p className="mb-6 text-sm text-[var(--muted)]">
        Manage incoming tickets and track team performance.
      </p>

      {loginError && (
        <p className="mb-5 rounded-lg bg-[var(--pri-high-soft)] px-3.5 py-2.5 text-sm text-[var(--err)]">
          {loginError}
        </p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <FormField id="email" label="Email" required error={errors.email?.message}>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="priya@example.com"
            className="field-input"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
        </FormField>
        <FormField id="password" label="Password" required error={errors.password?.message}>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            className="field-input"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
        </FormField>
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-focus mt-1 flex items-center justify-center gap-2 rounded-lg bg-[var(--accent)] py-2.5 text-sm font-semibold text-[var(--accent-ink)] disabled:opacity-70"
        >
          {isSubmitting && <IconSpinner />}
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-[var(--muted)]">
        Demo credentials — email <span className="font-mono">priya@example.com</span>, password{" "}
        <span className="font-mono">incidentdesk123</span>
      </p>
    </section>
  );
}
