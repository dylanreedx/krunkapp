import { NextResponse, type NextRequest } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/server/db";
import { env } from "@/env";
import { queue, queueSong, user } from "@/server/db/schema";
import { publishQueue } from "@/lib/publish";

export const runtime = "nodejs";

function getTodayDropDay(): "friday" | "sunday" | null {
  const day = new Date().getDay();
  if (day === 5) return "friday";
  if (day === 0) return "sunday";
  return null;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (env.CRON_SECRET && authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const todayDrop = getTodayDropDay();
  if (!todayDrop) {
    return NextResponse.json({ message: "Not a drop day", published: 0 });
  }

  // Find draft queues with songs whose creator's dropDay matches today
  const queuesWithSongs = await db
    .select({ id: queue.id })
    .from(queue)
    .innerJoin(user, eq(user.id, queue.creatorId))
    .where(
      and(
        eq(queue.status, "draft"),
        eq(user.dropDay, todayDrop),
        sql`(SELECT COUNT(*) FROM krunked_queue_song WHERE queueId = ${queue.id}) > 0`,
      ),
    );

  const results: { queueId: string; status: "ok" | "error"; error?: string }[] =
    [];

  for (const q of queuesWithSongs) {
    try {
      await publishQueue(q.id, db);
      results.push({ queueId: q.id, status: "ok" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error(`Failed to publish queue ${q.id}:`, message);
      results.push({ queueId: q.id, status: "error", error: message });
    }
  }

  return NextResponse.json({
    published: results.filter((r) => r.status === "ok").length,
    failed: results.filter((r) => r.status === "error").length,
    results,
  });
}
