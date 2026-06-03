import { NextRequest } from "next/server";
import { getRun, subscribe } from "@/lib/ad-generator-runs";

export const dynamic = "force-dynamic";

/**
 * Server-Sent Events stream of pipeline log lines.
 * On connect, replays existing log buffer, then streams new lines as they arrive.
 * Closes when the run ends.
 */
export async function GET(_req: NextRequest, ctx: { params: { id: string } }) {
  const id = ctx.params.id;
  const run = getRun(id);
  if (!run) {
    return new Response("not found", { status: 404 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: string) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${data}\n\n`));
      };

      // Replay buffered lines
      for (const line of run.log) send("line", line);
      send("phase", run.phase);

      if (run.status === "completed" || run.status === "failed" || run.status === "killed") {
        send("end", run.status);
        controller.close();
        return;
      }

      const unsub = subscribe(
        id,
        (line) => send("line", line),
        (status) => {
          send("end", status);
          try { controller.close(); } catch { /* already closed */ }
          unsub();
        }
      );
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
