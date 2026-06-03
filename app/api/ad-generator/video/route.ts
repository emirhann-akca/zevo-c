import { NextRequest } from "next/server";
import { createReadStream, statSync, existsSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import { Readable } from "node:stream";

export const dynamic = "force-dynamic";

const OUTPUT_ROOT = resolve(process.cwd(), "tools", "ad-generator", "output");

/**
 * Streams a rendered video file with HTTP Range support so <video> can seek.
 * Only paths under tools/ad-generator/output are allowed (prevents directory traversal).
 */
export async function GET(req: NextRequest) {
  const rel = req.nextUrl.searchParams.get("path");
  if (!rel) return new Response("missing ?path", { status: 400 });

  const abs = resolve(OUTPUT_ROOT, rel);
  if (!abs.startsWith(OUTPUT_ROOT + sep) && abs !== OUTPUT_ROOT) {
    return new Response("forbidden", { status: 403 });
  }
  if (!existsSync(abs)) return new Response("not found", { status: 404 });

  const stat = statSync(abs);
  const size = stat.size;
  const range = req.headers.get("range");
  const ext = abs.toLowerCase().split(".").pop() ?? "mp4";
  const contentType =
    ext === "mp4" ? "video/mp4" :
    ext === "webm" ? "video/webm" :
    ext === "mp3" ? "audio/mpeg" :
    ext === "jpg" || ext === "jpeg" ? "image/jpeg" :
    ext === "png" ? "image/png" :
    "application/octet-stream";

  if (range) {
    const m = range.match(/bytes=(\d+)-(\d+)?/);
    if (m) {
      const start = parseInt(m[1], 10);
      const end = m[2] ? parseInt(m[2], 10) : size - 1;
      const chunkSize = end - start + 1;
      const fileStream = createReadStream(abs, { start, end });
      return new Response(Readable.toWeb(fileStream) as unknown as ReadableStream, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${size}`,
          "Accept-Ranges": "bytes",
          "Content-Length": String(chunkSize),
          "Content-Type": contentType,
        },
      });
    }
  }

  const fileStream = createReadStream(abs);
  return new Response(Readable.toWeb(fileStream) as unknown as ReadableStream, {
    headers: {
      "Content-Length": String(size),
      "Content-Type": contentType,
      "Accept-Ranges": "bytes",
    },
  });
}
