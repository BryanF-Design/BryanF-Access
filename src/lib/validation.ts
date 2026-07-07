import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Escribe un correo válido.").max(254),
  turnstileToken: z.string().optional().or(z.literal("")).default(""),
  // Honeypot: real visitors never see or fill this field. Any value here
  // means a bot filled every input on the form, so we quietly drop the
  // request instead of hinting to the bot what tripped it.
  website: z.string().max(0, "").optional().or(z.literal("")),
});

export type LoginInput = z.infer<typeof loginSchema>;
