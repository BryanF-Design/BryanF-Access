import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// React's dev-mode debugging (HMR, call-stack reconstruction) needs eval();
// it's never used in production builds, so we only relax the policy locally.
const scriptSrc = process.env.NODE_ENV === "development"
  ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com"
  : "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com";

const CSP = [
  "default-src 'self'",
  scriptSrc,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://*.supabase.co",
  "media-src 'self'",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co https://challenges.cloudflare.com",
  "frame-src https://challenges.cloudflare.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

export async function proxy(request: NextRequest) {
  const response = await updateSession(request);

  response.headers.set("Content-Security-Policy", CSP);
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()",
  );
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload",
  );

  return response;
}

export const config = {
  matcher: [
    /*
     * Run on everything except framework assets and known public files,
     * so every page navigation and route handler gets the security headers
     * and session refresh above.
     */
    "/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|logo.png|icon-mark.png|icon-favicon.png).*)",
  ],
};
