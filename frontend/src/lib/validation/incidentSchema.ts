import { z } from "zod";

export const incidentSchema = z.object({
  name: z.string().trim().min(1, "Enter your name."),
  email: z
    .string()
    .trim()
    .min(1, "Enter your email address.")
    .email("Enter a valid email address."),
  title: z
    .string()
    .trim()
    .min(5, "Title needs at least 5 characters.")
    .max(150, "Title must be 150 characters or fewer."),
  description: z
    .string()
    .trim()
    .min(20, "Add a bit more detail (at least 20 characters)."),
});

export type IncidentFormValues = z.infer<typeof incidentSchema>;
