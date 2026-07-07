import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Admin, Client } from "@/types/database";

export const dynamic = "force-dynamic";

const CONTENT_TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

function forbidden() {
  return NextResponse.json({ error: "No autorizado." }, { status: 403 });
}

async function canReadTutorials() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const [{ data: client }, { data: admin }] = await Promise.all([
    supabase
      .from("clients")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle<Pick<Client, "id">>(),
    supabase
      .from("admins")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle<Pick<Admin, "id">>(),
  ]);

  return Boolean(client || admin);
}

function resolveAsset(segments: string[]) {
  if (segments.length === 0 || segments.some((segment) => segment === ".." || segment.includes("\\"))) {
    return null;
  }

  const root = path.join(process.cwd(), "protected", "tutorials");
  const requested = path.join(root, segments.join(path.sep));
  const rootWithSeparator = `${root}${path.sep}`;

  if (requested !== root && !requested.startsWith(rootWithSeparator)) {
    return null;
  }

  return requested;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  if (!(await canReadTutorials())) return forbidden();

  const { path: segments } = await params;
  const filePath = resolveAsset(segments);
  if (!filePath) return NextResponse.json({ error: "Archivo no encontrado." }, { status: 404 });

  let fileStat;
  try {
    fileStat = await stat(filePath);
  } catch {
    return NextResponse.json({ error: "Archivo no encontrado." }, { status: 404 });
  }

  if (!fileStat.isFile()) {
    return NextResponse.json({ error: "Archivo no encontrado." }, { status: 404 });
  }

  const contentType = CONTENT_TYPES[path.extname(filePath).toLowerCase()] ?? "application/octet-stream";
  const range = request.headers.get("range");

  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match) return new Response(null, { status: 416 });

    const start = match[1] ? Number(match[1]) : 0;
    const end = match[2] ? Number(match[2]) : fileStat.size - 1;

    if (Number.isNaN(start) || Number.isNaN(end) || start > end || end >= fileStat.size) {
      return new Response(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${fileStat.size}` },
      });
    }

    const stream = Readable.toWeb(createReadStream(filePath, { start, end })) as ReadableStream;
    return new Response(stream, {
      status: 206,
      headers: {
        "Accept-Ranges": "bytes",
        "Cache-Control": "private, no-store",
        "Content-Length": String(end - start + 1),
        "Content-Range": `bytes ${start}-${end}/${fileStat.size}`,
        "Content-Type": contentType,
      },
    });
  }

  const stream = Readable.toWeb(createReadStream(filePath)) as ReadableStream;
  return new Response(stream, {
    headers: {
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, no-store",
      "Content-Length": String(fileStat.size),
      "Content-Type": contentType,
    },
  });
}
