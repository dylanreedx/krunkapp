import type { MetadataRoute } from "next";
import { db } from "@/server/db";
import { queue } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const publishedQueues = await db
    .select({ id: queue.id, updatedAt: queue.updatedAt })
    .from(queue)
    .where(eq(queue.status, "published"));

  return [
    {
      url: "https://getkrunk.app",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...publishedQueues.map((q) => ({
      url: `https://getkrunk.app/queue/${q.id}`,
      lastModified: q.updatedAt ?? new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
