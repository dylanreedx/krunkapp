import { and, eq } from "drizzle-orm";
import { put } from "@vercel/blob";
import type { db as DbType } from "@/server/db";
import {
  queue,
  queueRecipient,
  queueSong,
  user,
  account,
} from "@/server/db/schema";
import { sendQueueNotification } from "@/lib/twilio";
import { runAIPipeline } from "@/lib/ai/pipeline";
import {
  createPlaylistsForAllRecipients,
  type RecipientInfo,
} from "@/lib/playlist-creator";
import { env } from "@/env";

/**
 * Publish a queue: generate AI metadata, create platform playlists, notify recipients.
 */
export async function publishQueue(
  queueId: string,
  db: typeof DbType,
): Promise<void> {
  // 1. Fetch queue with songs and recipients (including user details)
  const queueData = await db.query.queue.findFirst({
    where: eq(queue.id, queueId),
    with: {
      creator: true,
      songs: true,
      recipients: {
        with: {
          user: true,
        },
      },
    },
  });

  if (!queueData) {
    throw new Error(`Queue ${queueId} not found`);
  }

  if (queueData.status === "published") {
    throw new Error(`Queue ${queueId} is already published`);
  }

  // 2. Run AI pipeline — generate name + cover art from songs
  const now = new Date();
  const weekLabel = `Week of ${now.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  let aiName = weekLabel;
  let aiCoverUrl: string | null = null;
  let coverImageBase64: string | undefined;

  try {
    const songInputs = queueData.songs.map((s) => ({
      title: s.title,
      artist: s.artist,
      albumArtUrl: s.albumArtUrl,
    }));

    const result = await runAIPipeline(songInputs);
    aiName = result.aiName;

    // 3. Upload cover image to Vercel Blob
    const blob = await put(
      `covers/${queueId}.png`,
      result.coverImageBuffer,
      {
        access: "public",
        contentType: "image/png",
      },
    );
    aiCoverUrl = blob.url;

    // Keep base64 version for Spotify playlist cover upload
    coverImageBase64 = result.coverImageBuffer.toString("base64");
  } catch (err) {
    console.error(
      `AI pipeline failed for queue ${queueId}, falling back to defaults:`,
      err,
    );
    // aiName stays as weekLabel, aiCoverUrl stays null
  }

  // 4. Create playlists on each recipient's platform (only for recipients with a userId)
  try {
    const recipientInfos: RecipientInfo[] = [];

    for (const r of queueData.recipients) {
      // Skip phone-only recipients — they don't have an account yet
      if (!r.userId) continue;

      const userAccounts = await db.query.account.findMany({
        where: eq(account.userId, r.userId),
      });

      const spotifyAccount = userAccounts.find(
        (a) => a.providerId === "spotify",
      );
      const appleMusicAccount = userAccounts.find(
        (a) => a.providerId === "apple-music",
      );

      recipientInfos.push({
        userId: r.userId,
        platformPreference:
          (r.user?.platformPreference as "spotify" | "apple_music") ?? "spotify",
        spotifyAccessToken: spotifyAccount?.accessToken ?? undefined,
        spotifyUserId: r.user?.spotifyId ?? undefined,
        appleMusicUserToken: appleMusicAccount?.accessToken ?? undefined,
        appleMusicDeveloperToken: env.APPLE_MUSIC_KEY_ID ?? undefined,
      });
    }

    const songs = queueData.songs.map((s) => ({
      spotifyUri: s.spotifyUri,
      appleMusicId: s.appleMusicId,
    }));

    const playlistResults = await createPlaylistsForAllRecipients({
      recipients: recipientInfos,
      queueName: aiName,
      songs,
      coverImageBase64,
    });

    // Update each recipient record with their playlist info
    for (const pr of playlistResults) {
      await db
        .update(queueRecipient)
        .set({
          platformPlaylistId: pr.platformPlaylistId,
          platformPlaylistUrl: pr.platformPlaylistUrl,
        })
        .where(
          and(
            eq(queueRecipient.queueId, queueId),
            eq(queueRecipient.userId, pr.userId),
          ),
        );
    }
  } catch (err) {
    console.error(
      `Playlist creation failed for queue ${queueId}:`,
      err,
    );
    // Non-fatal — queue still publishes without playlists
  }

  // 5. Update queue: set status, publishedAt, AI metadata
  await db
    .update(queue)
    .set({
      status: "published",
      publishedAt: now,
      aiName,
      aiCoverUrl,
    })
    .where(eq(queue.id, queueId));

  // 6. Send SMS to each recipient who has a phone number
  // For userId recipients: use user's phoneNumber. For phone-only recipients: use recipient phoneNumber directly.
  const senderName =
    queueData.creator.displayName ?? queueData.creator.name ?? "Someone";
  const queueName = aiName;

  const phonesToNotify: string[] = [];
  for (const r of queueData.recipients) {
    const phone = r.user?.phoneNumber ?? r.phoneNumber;
    if (phone) phonesToNotify.push(phone);
  }

  const smsPromises = phonesToNotify.map((phone) =>
    sendQueueNotification(
      phone,
      senderName,
      queueId,
      queueName,
    ).catch((err) => {
      console.error(`Failed to send SMS to ${phone}:`, err);
    }),
  );

  await Promise.allSettled(smsPromises);
}
