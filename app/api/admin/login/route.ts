import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { generateAdminToken, ADMIN_COOKIE } from "@/lib/admin-auth";

function getIP(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  const ip = getIP(req);

  // 8 attempts per IP per 15 minutes
  if (!rateLimit(`login:${ip}`, 8, 15 * 60 * 1000)) {
    return NextResponse.json(
      { ok: false, error: "Demasiados intentos. Intenta en 15 minutos." },
      { status: 429 }
    );
  }

  const { password } = await req.json();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return NextResponse.json({ error: "No configurado." }, { status: 500 });
  }

  // Constant-time comparison
  const a = Buffer.from(password ?? "");
  const b = Buffer.from(adminPassword);
  const valid =
    a.length === b.length && Buffer.compare(a, b) === 0;

  // Small artificial delay to slow brute force
  await new Promise((r) => setTimeout(r, 300));

  if (!valid) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const token = await generateAdminToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 6, // 6 hours
    path: "/",
  });
  return res;
}
