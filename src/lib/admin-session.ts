import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_COOKIE = "bryanf_admin_session";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 30;

interface AdminSessionPayload {
  email: string;
  exp: number;
}

function base64Url(input: string | Buffer) {
  return Buffer.from(input).toString("base64url");
}

function getAdminSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
}

function sign(value: string) {
  const secret = getAdminSessionSecret();
  if (!secret) return "";

  return createHmac("sha256", secret).update(value).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  return aBuffer.length === bBuffer.length && timingSafeEqual(aBuffer, bBuffer);
}

export function getConfiguredAdminEmail() {
  return (process.env.ADMIN_EMAIL ?? "bryanf@bryanfdesign.com.mx").trim().toLowerCase();
}

export function createAdminSessionToken(email: string) {
  const payload: AdminSessionPayload = {
    email: email.trim().toLowerCase(),
    exp: Date.now() + ADMIN_SESSION_MAX_AGE * 1000,
  };
  const encoded = base64Url(JSON.stringify(payload));
  const signature = sign(encoded);

  if (!signature) return null;

  return `${encoded}.${signature}`;
}

export function verifyAdminSessionToken(token: string | undefined) {
  if (!token) return null;

  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = sign(encoded);
  if (!expected || !safeEqual(signature, expected)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as AdminSessionPayload;
    if (!payload.email || payload.exp < Date.now()) return null;
    if (payload.email !== getConfiguredAdminEmail()) return null;
    return payload.email;
  } catch {
    return null;
  }
}

export function isAdminPasswordValid(password: string) {
  const configured = process.env.ADMIN_ACCESS_PASSWORD;
  if (!configured) return false;

  const submittedBuffer = Buffer.from(password);
  const configuredBuffer = Buffer.from(configured);
  return submittedBuffer.length === configuredBuffer.length && timingSafeEqual(submittedBuffer, configuredBuffer);
}
