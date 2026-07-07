"use server";

import { headers } from "next/headers";
import { checkRateLimit } from "@/lib/rate-limit";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { verifyTurnstile } from "@/lib/turnstile";
import { loginSchema } from "@/lib/validation";

export interface LoginActionState {
  ok: boolean;
  message: string;
}

async function logAttempt(event: string, email: string | null, ip: string) {
  try {
    const service = createServiceRoleClient();
    await service.from("audit_log").insert({
      actor_email: email,
      event,
      metadata: {},
      ip,
    });
  } catch {
    // Auditing must never break the login flow.
  }
}

function getSafeOrigin(headerOrigin: string | null) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const configuredOrigin = new URL(configured).origin;

  if (!headerOrigin) return configuredOrigin;

  try {
    const requestOrigin = new URL(headerOrigin).origin;
    const isLocalDev =
      process.env.NODE_ENV !== "production" &&
      (requestOrigin.startsWith("http://localhost") ||
        requestOrigin.startsWith("http://127.0.0.1"));

    return requestOrigin === configuredOrigin || isLocalDev ? requestOrigin : configuredOrigin;
  } catch {
    return configuredOrigin;
  }
}

export async function requestMagicLink(
  _prev: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    turnstileToken: formData.get("turnstileToken"),
    website: formData.get("website"),
  });

  const genericSuccess: LoginActionState = {
    ok: true,
    message: "Si el correo esta registrado, te enviamos un enlace de acceso.",
  };

  if (!parsed.success) {
    if (formData.get("website")) {
      await logAttempt("login_honeypot", null, ip);
      return genericSuccess;
    }
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Revisa los datos e intenta de nuevo.",
    };
  }

  const { email, turnstileToken } = parsed.data;

  const [ipLimit, emailLimit] = await Promise.all([
    checkRateLimit(`login:ip:${ip}`, 20, 10 * 60_000),
    checkRateLimit(`login:email:${email}`, 5, 10 * 60_000),
  ]);

  if (!ipLimit.ok || !emailLimit.ok) {
    await logAttempt("login_rate_limited", email, ip);
    return {
      ok: false,
      message: "Demasiados intentos. Espera unos minutos antes de volver a intentar.",
    };
  }

  const isHuman = await verifyTurnstile(turnstileToken, ip);
  if (!isHuman) {
    await logAttempt("login_turnstile_failed", email, ip);
    return {
      ok: false,
      message: "No pudimos verificar que eres humano. Intenta de nuevo.",
    };
  }

  const origin = getSafeOrigin(headerList.get("origin"));
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      shouldCreateUser: false,
    },
  });

  await logAttempt(error ? "login_send_failed" : "login_link_sent", email, ip);

  return genericSuccess;
}
