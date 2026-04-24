import { z } from "zod";

export const projectTypes = ["website", "product", "moplayer", "case-study", "consulting", "other"] as const;
export const budgetRanges = ["not-sure", "under-1000", "1000-3000", "3000-7000", "7000-plus"] as const;
export const timelines = ["this-month", "one-three-months", "flexible", "support-only"] as const;

export const contactMessageSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email().trim().max(160),
  whatsapp: z.string().trim().max(60).optional().or(z.literal("")),
  projectType: z.enum(projectTypes),
  budgetRange: z.enum(budgetRanges),
  timeline: z.enum(timelines),
  message: z.string().trim().min(20).max(5000),
  consent: z.literal(true),
  honeypot: z.string().trim().max(0).optional().or(z.literal("")),
  locale: z.enum(["ar", "en"]).default("en"),
  subject: z.string().trim().max(180).optional().or(z.literal("")),
});

export type ContactMessageInput = z.infer<typeof contactMessageSchema>;

export function contactFieldErrors(error: z.ZodError) {
  const fieldErrors: Partial<Record<keyof ContactMessageInput, string>> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !(key in fieldErrors)) {
      fieldErrors[key as keyof ContactMessageInput] = issue.message;
    }
  }
  return fieldErrors;
}
