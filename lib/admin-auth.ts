async function computeToken(): Promise<string> {
  const secret = process.env.ADMIN_PASSWORD!;
  // Rotates every 6 hours
  const bucket = Math.floor(Date.now() / (1000 * 60 * 60 * 6));
  const data = new TextEncoder().encode(`bryanf-access:${bucket}:${secret}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function generateAdminToken(): Promise<string> {
  return computeToken();
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  if (!token) return false;
  const expected = await computeToken();
  // Constant-time comparison to prevent timing attacks
  if (token.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < token.length; i++) {
    diff |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

export const ADMIN_COOKIE = "bryanf_admin_tok";
