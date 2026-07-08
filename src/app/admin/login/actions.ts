"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE,
  createAdminSessionToken,
  getConfiguredAdminEmail,
  isAdminPasswordValid,
} from "@/lib/admin-session";
import { createServiceRoleClient } from "@/lib/supabase/server";

export interface AdminLoginState {
  ok: boolean;
  message: string;
}

async function auditAdminLogin(event: string, ip: string, metadata: Record<string, unknown> = {}) {
  try {
    const service = createServiceRoleClient();
    await service.from("audit_log").insert({
      actor_email: getConfiguredAdminEmail(),
      event,
      metadata,
      ip,
    });
  } catch {
    // Admin login should not fail because audit logging is unavailable.
  }
}

export async function loginAdmin(_prev: AdminLoginState, formData: FormData): Promise<AdminLoginState> {
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const password = String(formData.get("password") ?? "");
  const website = String(formData.get("website") ?? "");

  if (website) {
    await auditAdminLogin("admin_login_honeypot", ip);
    return { ok: false, message: "No se pudo iniciar sesión." };
  }

  const [ipLimit, emailLimit] = await Promise.all([
    checkRateLimit(`admin-login:ip:${ip}`, 20, 10 * 60_000),
    checkRateLimit(`admin-login:email:${getConfiguredAdminEmail()}`, 20, 10 * 60_000),
  ]);

  if (!ipLimit.ok || !emailLimit.ok) {
    await auditAdminLogin("admin_login_rate_limited", ip);
    return { ok: false, message: "Demasiados intentos. Espera 1 minuto." };
  }

  if (!process.env.ADMIN_ACCESS_PASSWORD) {
    await auditAdminLogin("admin_login_missing_password", ip);
    return { ok: false, message: "Falta ADMIN_ACCESS_PASSWORD en Vercel." };
  }

  if (!isAdminPasswordValid(password)) {
    await auditAdminLogin("admin_login_failed", ip);
    return { ok: false, message: "Contraseña incorrecta." };
  }

  const service = createServiceRoleClient();
  const adminEmail = getConfiguredAdminEmail();
  const { data: admin } = await service
    .from("admins")
    .select("id, email")
    .eq("email", adminEmail)
    .maybeSingle<{ id: string; email: string }>();

  if (!admin) {
    await auditAdminLogin("admin_login_missing_admin_row", ip);
    return { ok: false, message: "Tu correo no está registrado en la tabla admins." };
  }

  const token = createAdminSessionToken(admin.email);
  if (!token) {
    await auditAdminLogin("admin_login_missing_secret", ip);
    return { ok: false, message: "Falta ADMIN_SESSION_SECRET o SUPABASE_SERVICE_ROLE_KEY." };
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE,
  });

  await auditAdminLogin("admin_login_success", ip);
  redirect("/admin");
}
