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

type LoginAccountKind = "admin" | "client" | "unknown";

const LOGIN_RATE_LIMITS: Record<
  LoginAccountKind,
  { emailLimit: number; emailWindowMs: number; ipLimit: number; ipWindowMs: number }
> = {
  admin: {
    emailLimit: 12,
    emailWindowMs: 10 * 60_000,
    ipLimit: 80,
    ipWindowMs: 10 * 60_000,
  },
  client: {
    emailLimit: 8,
    emailWindowMs: 10 * 60_000,
    ipLimit: 50,
    ipWindowMs: 10 * 60_000,
  },
  unknown: {
    emailLimit: 4,
    emailWindowMs: 10 * 60_000,
    ipLimit: 30,
    ipWindowMs: 10 * 60_000,
  },
};

async function logAttempt(
  event: string,
  email: string | null,
  ip: string,
  metadata: Record<string, unknown> = {},
) {
  try {
    const service = createServiceRoleClient();
    await service.from("audit_log").insert({
      actor_email: email,
      event,
      metadata,
      ip,
    });
  } catch {
    // Auditing must never break the login flow.
  }
}

async function getLoginAccountKind(email: string): Promise<LoginAccountKind> {
  try {
    const service = createServiceRoleClient();
    const [{ data: admin }, { data: client }] = await Promise.all([
      service.from("admins").select("id").eq("email", email).maybeSingle<{ id: string }>(),
      service.from("clients").select("id").eq("email", email).maybeSingle<{ id: string }>(),
    ]);

    if (admin) return "admin";
    if (client) return "client";
  } catch {
    // If service-role lookup is unavailable, keep the login flow generic.
  }

  return "unknown";
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

  const email = parsed.data.email.toLowerCase();
  const { turnstileToken } = parsed.data;
  const accountKind = await getLoginAccountKind(email);
  const limits = LOGIN_RATE_LIMITS[accountKind];

  const [ipLimit, emailLimit] = await Promise.all([
    checkRateLimit(`login:${accountKind}:ip:${ip}`, limits.ipLimit, limits.ipWindowMs),
    checkRateLimit(`login:${accountKind}:email:${email}`, limits.emailLimit, limits.emailWindowMs),
  ]);

  if (!ipLimit.ok || !emailLimit.ok) {
    await logAttempt("login_rate_limited", email, ip, {
      account_kind: accountKind,
      ip_remaining: ipLimit.remaining,
      email_remaining: emailLimit.remaining,
      retry_after_ms: Math.max(ipLimit.retryAfterMs, emailLimit.retryAfterMs),
    });
    return {
      ok: false,
      message: "Demasiados intentos. Espera 1 minuto antes de volver a intentar.",
    };
  }

  const isHuman = await verifyTurnstile(turnstileToken, ip);
  if (!isHuman) {
    await logAttempt("login_turnstile_failed", email, ip, { account_kind: accountKind });
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

  await logAttempt(error ? "login_send_failed" : "login_link_sent", email, ip, {
    account_kind: accountKind,
    error: error?.message ?? null,
  });

  return genericSuccess;
}
