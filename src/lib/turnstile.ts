/**
 * Server-side verification of a Cloudflare Turnstile token. Never trust the
 * client's word that a challenge passed — always re-check the token against
 * Cloudflare from the server before acting on the form submission.
 */
export async function verifyTurnstile(token: string, remoteIp?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  // Allow local development without Cloudflare keys configured, but never
  // silently skip verification once a secret is present in the environment.
  if (!secret) {
    if (process.env.NODE_ENV === "production") return false;
    return true;
  }

  if (!token) return false;

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret,
        response: token,
        ...(remoteIp ? { remoteip: remoteIp } : {}),
      }),
    });

    if (!res.ok) return false;

    const data: { success: boolean } = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}
