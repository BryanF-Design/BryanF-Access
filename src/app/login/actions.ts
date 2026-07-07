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

function toOrigin(value: string | null) {
  if (!value) return null;

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function getConfiguredOrigin() {
  return (
    toOrigin(process.env.NEXT_PUBLIC_SITE_URL ?? null) ??
    toOrigin(
      process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : null,
    ) ??
    toOrigin(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
  );
}

function getRequestOrigin(headerList: Headers) {
  const headerOrigin = toOrigin(headerList.get("origin"));
  if (headerOrigin) return headerOrigin;

  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  if (!host) return null;

  const proto =
    headerList.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");

  return toOrigin(`${proto}://${host}`);
}

function getSafeOrigin(headerList: Headers) {
  const configuredOrigin = getConfiguredOrigin();
  const requestOrigin = getRequestOrigin(headerList);

  if (configuredOrigin) return configuredOrigin;

  try {
    const isLocalDev =
      process.env.NODE_ENV !== "production" &&
      requestOrigin &&
      (requestOrigin.startsWith("http://localhost") || requestOrigin.startsWith("http://127.0.0.1"));

    if (isLocalDev) return requestOrigin;

    if (requestOrigin?.startsWith("https://")) return requestOrigin;
  } catch {
    // Fall through to the local default below.
  }

  return "http://localhost:3000";
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

  const origin = getSafeOrigin(headerList);
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
