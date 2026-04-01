import { TRPCError } from "@trpc/server";
import { and, asc, count, desc, eq, max, or, sql } from "drizzle-orm";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { account, friendship, queue, queueRecipient, queueSong, user } from "@/server/db/schema";
import { sendSMS } from "@/lib/twilio";
import { runAIPipeline } from "@/lib/ai/pipeline";
import { resolveSongUrl } from "@/lib/resolver";
import { getClientCredentialsToken } from "@/lib/spotify/token";
import { generateDeveloperToken } from "@/lib/apple-music/token";
import { getRecommendations } from "@/lib/recommendations";

/** Returns the ISO date string (YYYY-MM-DD) of Monday for the current week. */
function getCurrentWeekMonday(): string {
  const now = new Date();
  const day = now.getDay(); // 0=Sun … 6=Sat
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return monday.toISOString().slice(0, 10);
}

export const queueRouter = createTRPCRouter({
  /**
   * Create a new draft queue with weekStartDate set to current week's Monday.
   */
  create: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const [created] = await ctx.db
      .insert(queue)
      .values({
        creatorId: userId,
        weekStartDate: getCurrentWeekMonday(),
      })
      .returning();

    return created;
  }),

  /**
   * List queues where user is creator OR recipient.
   * Optional status filter. Ordered by weekStartDate desc.
   */
  list: protectedProcedure
    .input(
      z
        .object({
          status: z.enum(["draft", "published"]).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Subquery: queue IDs where user is a recipient
      const recipientQueueIds = ctx.db
        .select({ queueId: queueRecipient.queueId })
        .from(queueRecipient)
        .where(eq(queueRecipient.userId, userId));

      const conditions = [
        or(
          eq(queue.creatorId, userId),
          sql`${queue.id} IN (${recipientQueueIds})`,
        ),
      ];

      if (input?.status) {
        conditions.push(eq(queue.status, input.status));
      }

      // Song count subquery
      const songCount = ctx.db
        .select({
          queueId: queueSong.queueId,
          count: count().as("song_count"),
        })
        .from(queueSong)
        .groupBy(queueSong.queueId)
        .as("song_counts");

      // Recipient count subquery
      const recipientCount = ctx.db
        .select({
          queueId: queueRecipient.queueId,
          count: count().as("recipient_count"),
        })
        .from(queueRecipient)
        .groupBy(queueRecipient.queueId)
        .as("recipient_counts");

      const rows = await ctx.db
        .select({
          id: queue.id,
          creatorId: queue.creatorId,
          aiName: queue.aiName,
          aiCoverUrl: queue.aiCoverUrl,
          status: queue.status,
          publishedAt: queue.publishedAt,
          weekStartDate: queue.weekStartDate,
          createdAt: queue.createdAt,
          updatedAt: queue.updatedAt,
          songCount: sql<number>`COALESCE(${songCount.count}, 0)`.as(
            "song_count",
          ),
          recipientCount:
            sql<number>`COALESCE(${recipientCount.count}, 0)`.as(
              "recipient_count",
            ),
        })
        .from(queue)
        .leftJoin(songCount, eq(queue.id, songCount.queueId))
        .leftJoin(recipientCount, eq(queue.id, recipientCount.queueId))
        .where(and(...conditions))
        .orderBy(desc(queue.weekStartDate));

      return rows;
    }),

  /**
   * Get a single queue with all songs and recipients.
   * Auth check: must be creator or recipient.
   */
  getById: protectedProcedure
    .input(z.object({ queueId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const result = await ctx.db.query.queue.findFirst({
        where: eq(queue.id, input.queueId),
        with: {
          songs: {
            orderBy: (songs, { asc }) => [asc(songs.position)],
          },
          recipients: true,
        },
      });

      if (!result) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Queue not found" });
      }

      const isCreator = result.creatorId === userId;
      const isRecipient = result.recipients.some((r) => r.userId === userId);

      if (!isCreator && !isRecipient) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to view this queue",
        });
      }

      return result;
    }),

  /**
   * Delete a draft queue. Only the creator can delete. Cannot delete published queues.
   */
  delete: protectedProcedure
    .input(z.object({ queueId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const existing = await ctx.db.query.queue.findFirst({
        where: eq(queue.id, input.queueId),
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Queue not found" });
      }

      if (existing.creatorId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the creator can delete this queue",
        });
      }

      if (existing.status === "published") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete a published queue",
        });
      }

      await ctx.db.delete(queue).where(eq(queue.id, input.queueId));

      return { success: true };
    }),

  /**
   * Add a song to a queue. Accepts pre-resolved song data.
   */
  addSong: protectedProcedure
    .input(
      z.object({
        queueId: z.string(),
        url: z.string().optional(),
        // Allow direct fields as fallback
        title: z.string().optional(),
        artist: z.string().optional(),
        album: z.string().optional(),
        albumArtUrl: z.string().optional(),
        isrcCode: z.string().optional(),
        spotifyUri: z.string().optional(),
        appleMusicId: z.string().optional(),
        audioFeatures: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const existing = await ctx.db.query.queue.findFirst({
        where: eq(queue.id, input.queueId),
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Queue not found" });
      }

      if (existing.creatorId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the creator can add songs",
        });
      }

      // Resolve song metadata from URL if provided
      let songData = {
        title: input.title ?? "Unknown",
        artist: input.artist ?? "Unknown",
        album: input.album ?? null,
        albumArtUrl: input.albumArtUrl ?? null,
        isrcCode: input.isrcCode ?? null,
        spotifyUri: input.spotifyUri ?? null,
        appleMusicId: input.appleMusicId ?? null,
        audioFeatures: input.audioFeatures ?? null,
      };

      const url = input.url ?? input.spotifyUri ?? input.appleMusicId;

      if (url && (url.includes("spotify") || url.includes("music.apple.com"))) {
        try {
          // Use client credentials for Spotify — public track data doesn't need user auth
          const { accessToken: spotifyToken } = await getClientCredentialsToken();

          // For Apple Music, generate a developer token + get user token
          let appleMusicTokens: { developerToken: string; userToken: string } | undefined;
          if (url.includes("music.apple.com")) {
            const appleAccount = await ctx.db.query.account.findFirst({
              where: and(
                eq(account.userId, userId),
                eq(account.providerId, "apple_music"),
              ),
            });
            if (appleAccount?.accessToken) {
              const devToken = await generateDeveloperToken();
              appleMusicTokens = {
                developerToken: devToken,
                userToken: appleAccount.accessToken,
              };
            }
          }

          const resolved = await resolveSongUrl(url, spotifyToken, appleMusicTokens);
          songData = {
            title: resolved.title,
            artist: resolved.artist,
            album: resolved.album,
            albumArtUrl: resolved.albumArtUrl,
            isrcCode: resolved.isrcCode,
            spotifyUri: resolved.spotifyUri,
            appleMusicId: resolved.appleMusicId,
            audioFeatures: resolved.audioFeatures
              ? JSON.stringify(resolved.audioFeatures)
              : null,
          };
        } catch (err) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Failed to resolve song: ${err instanceof Error ? err.message : "Unknown error"}`,
          });
        }
      }

      const [maxPos] = await ctx.db
        .select({ maxPosition: max(queueSong.position) })
        .from(queueSong)
        .where(eq(queueSong.queueId, input.queueId));

      const nextPosition = (maxPos?.maxPosition ?? -1) + 1;

      const [created] = await ctx.db
        .insert(queueSong)
        .values({
          queueId: input.queueId,
          ...songData,
          position: nextPosition,
        })
        .returning();

      return created;
    }),

  /**
   * Remove a song from a queue and reorder remaining songs.
   */
  removeSong: protectedProcedure
    .input(z.object({ songId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const song = await ctx.db.query.queueSong.findFirst({
        where: eq(queueSong.id, input.songId),
        with: { queue: true },
      });

      if (!song) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Song not found" });
      }

      if (song.queue.creatorId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the creator can remove songs",
        });
      }

      await ctx.db.delete(queueSong).where(eq(queueSong.id, input.songId));

      // Reorder remaining songs to close the gap
      const remaining = await ctx.db
        .select({ id: queueSong.id })
        .from(queueSong)
        .where(eq(queueSong.queueId, song.queueId))
        .orderBy(asc(queueSong.position));

      for (let i = 0; i < remaining.length; i++) {
        await ctx.db
          .update(queueSong)
          .set({ position: i })
          .where(eq(queueSong.id, remaining[i]!.id));
      }

      return { success: true };
    }),

  /**
   * Reorder songs in a queue by providing songIds in the desired order.
   */
  reorderSongs: protectedProcedure
    .input(
      z.object({
        queueId: z.string(),
        songIds: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const existing = await ctx.db.query.queue.findFirst({
        where: eq(queue.id, input.queueId),
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Queue not found" });
      }

      if (existing.creatorId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the creator can reorder songs",
        });
      }

      for (let i = 0; i < input.songIds.length; i++) {
        await ctx.db
          .update(queueSong)
          .set({ position: i })
          .where(
            and(
              eq(queueSong.id, input.songIds[i]!),
              eq(queueSong.queueId, input.queueId),
            ),
          );
      }

      return { success: true };
    }),

  /**
   * Add a recipient to a queue by userId (legacy). Creates friendship records.
   */
  addRecipient: protectedProcedure
    .input(
      z.object({
        queueId: z.string(),
        userId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const currentUserId = ctx.session.user.id;

      const existing = await ctx.db.query.queue.findFirst({
        where: eq(queue.id, input.queueId),
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Queue not found" });
      }

      if (existing.creatorId !== currentUserId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the creator can add recipients",
        });
      }

      // Insert recipient (ignore if already exists via unique constraint)
      await ctx.db
        .insert(queueRecipient)
        .values({
          queueId: input.queueId,
          userId: input.userId,
        })
        .onConflictDoNothing();

      // Create friendship in both directions if not exists
      await ctx.db
        .insert(friendship)
        .values({
          userId: currentUserId,
          friendId: input.userId,
        })
        .onConflictDoNothing();

      await ctx.db
        .insert(friendship)
        .values({
          userId: input.userId,
          friendId: currentUserId,
        })
        .onConflictDoNothing();

      return { success: true };
    }),

  /**
   * Add a recipient by phone number. If a user with that phone exists, also set userId.
   * If no user exists yet, they'll get the SMS on drop day and can sign up from there.
   */
  addPhoneRecipient: protectedProcedure
    .input(
      z.object({
        queueId: z.string(),
        phoneNumber: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const currentUserId = ctx.session.user.id;

      const existing = await ctx.db.query.queue.findFirst({
        where: eq(queue.id, input.queueId),
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Queue not found" });
      }

      if (existing.creatorId !== currentUserId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the creator can add recipients",
        });
      }

      // Check if a user with this phone already exists
      const existingUser = await ctx.db.query.user.findFirst({
        where: eq(user.phoneNumber, input.phoneNumber),
      });

      const recipientUserId = existingUser?.id ?? null;

      // Insert recipient with phoneNumber (and userId if found)
      await ctx.db
        .insert(queueRecipient)
        .values({
          queueId: input.queueId,
          userId: recipientUserId,
          phoneNumber: input.phoneNumber,
        })
        .onConflictDoNothing();

      // Create friendship if user exists
      if (recipientUserId) {
        await ctx.db
          .insert(friendship)
          .values({ userId: currentUserId, friendId: recipientUserId })
          .onConflictDoNothing();
        await ctx.db
          .insert(friendship)
          .values({ userId: recipientUserId, friendId: currentUserId })
          .onConflictDoNothing();
      }

      return {
        success: true,
        recipientUserId,
        displayName: existingUser?.displayName ?? existingUser?.name ?? null,
      };
    }),

  /**
   * Remove a recipient from a queue. Works with userId-based or phoneNumber-only recipients.
   */
  removeRecipient: protectedProcedure
    .input(
      z.object({
        queueId: z.string(),
        recipientId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const currentUserId = ctx.session.user.id;

      const existing = await ctx.db.query.queue.findFirst({
        where: eq(queue.id, input.queueId),
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Queue not found" });
      }

      if (existing.creatorId !== currentUserId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the creator can remove recipients",
        });
      }

      await ctx.db
        .delete(queueRecipient)
        .where(
          and(
            eq(queueRecipient.id, input.recipientId),
            eq(queueRecipient.queueId, input.queueId),
          ),
        );

      return { success: true };
    }),

  /**
   * Toggle the earlyDrop flag on a song.
   */
  toggleEarlyDrop: protectedProcedure
    .input(z.object({ songId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const song = await ctx.db.query.queueSong.findFirst({
        where: eq(queueSong.id, input.songId),
        with: { queue: true },
      });

      if (!song) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Song not found" });
      }

      if (song.queue.creatorId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the creator can toggle early drop",
        });
      }

      const newEarlyDrop = !song.earlyDrop;

      const [updated] = await ctx.db
        .update(queueSong)
        .set({
          earlyDrop: newEarlyDrop,
          earlyDroppedAt: newEarlyDrop ? new Date() : null,
        })
        .where(eq(queueSong.id, input.songId))
        .returning();

      return updated;
    }),

  /**
   * Publish a draft queue. Only the creator can publish. Must have at least one song.
   */
  publish: protectedProcedure
    .input(z.object({ queueId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const existing = await ctx.db.query.queue.findFirst({
        where: eq(queue.id, input.queueId),
        with: { songs: true },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Queue not found" });
      }

      if (existing.creatorId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the creator can publish",
        });
      }

      if (existing.status === "published") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Queue is already published",
        });
      }

      if (existing.songs.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot publish an empty queue",
        });
      }

      const [updated] = await ctx.db
        .update(queue)
        .set({
          status: "published",
          publishedAt: new Date(),
        })
        .where(eq(queue.id, input.queueId))
        .returning();

      return updated;
    }),

  /**
   * @deprecated Use addPhoneRecipient instead — no longer the primary flow.
   * Find a user by phone number.
   */
  findUserByPhone: protectedProcedure
    .input(z.object({ phoneNumber: z.string() }))
    .query(async ({ ctx, input }) => {
      const found = await ctx.db.query.user.findFirst({
        where: eq(user.phoneNumber, input.phoneNumber),
      });

      if (!found) {
        return null;
      }

      return {
        id: found.id,
        name: found.name,
        displayName: found.displayName,
        image: found.image,
      };
    }),

  /**
   * Send early-drop SMS notifications to all queue recipients.
   */
  earlyDropNotify: protectedProcedure
    .input(z.object({ songId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const song = await ctx.db.query.queueSong.findFirst({
        where: eq(queueSong.id, input.songId),
        with: {
          queue: {
            with: {
              recipients: {
                with: { user: true },
              },
              creator: true,
            },
          },
        },
      });

      if (!song) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Song not found" });
      }

      if (song.queue.creatorId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the creator can send early drop notifications",
        });
      }

      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL ??
        (process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : "http://localhost:3000");

      const senderName =
        song.queue.creator.displayName ?? song.queue.creator.name ?? "Someone";

      // Collect phone numbers: prefer user's phone if they have a userId, otherwise use recipient phoneNumber
      const phonesToNotify: string[] = [];
      for (const r of song.queue.recipients) {
        const phone = r.user?.phoneNumber ?? r.phoneNumber;
        if (phone) phonesToNotify.push(phone);
      }

      await Promise.allSettled(
        phonesToNotify.map((phone) =>
          sendSMS(
            phone,
            `${senderName} couldn't wait — early drop from their queue! 🔥 ${baseUrl}/queue/${song.queue.id}`,
          ),
        ),
      );

      return { success: true, notified: phonesToNotify.length };
    }),

  /**
   * Preview AI-generated name for a queue without persisting.
   */
  previewAI: protectedProcedure
    .input(z.object({ queueId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const existing = await ctx.db.query.queue.findFirst({
        where: eq(queue.id, input.queueId),
        with: { songs: true },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Queue not found" });
      }

      if (existing.creatorId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the creator can preview AI",
        });
      }

      if (existing.songs.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Queue must have at least one song to preview AI",
        });
      }

      try {
        const songs = existing.songs.map((s) => ({
          title: s.title,
          artist: s.artist,
          albumArtUrl: s.albumArtUrl,
        }));

        const { aiName, coverImageBuffer } = await runAIPipeline(songs);

        // Upload to Vercel Blob if token is available
        let coverImageUrl: string | undefined;
        try {
          const { put } = await import("@vercel/blob");
          const blob = await put(
            `previews/${input.queueId}-${Date.now()}.webp`,
            coverImageBuffer,
            { access: "public", contentType: "image/webp" },
          );
          coverImageUrl = blob.url;
        } catch {
          // Blob not configured — encode as data URL fallback
          coverImageUrl = `data:image/webp;base64,${coverImageBuffer.toString("base64")}`;
        }

        return { aiName, coverImageUrl };
      } catch (err) {
        console.error("AI preview failed:", err);
        return { aiName: "Untitled Queue", coverImageUrl: undefined };
      }
    }),

  /**
   * List all friends of the current user.
   */
  listFriends: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const friends = await ctx.db
      .select({
        id: user.id,
        name: user.name,
        displayName: user.displayName,
        email: user.email,
        image: user.image,
        platformPreference: user.platformPreference,
      })
      .from(friendship)
      .innerJoin(user, eq(friendship.friendId, user.id))
      .where(eq(friendship.userId, userId));

    return friends;
  }),

  /**
   * Get Spotify recommendations seeded from a queue's songs.
   * Public — the queue view page is accessible without auth.
   */
  getRecommendations: publicProcedure
    .input(z.object({ queueId: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db.query.queue.findFirst({
        where: eq(queue.id, input.queueId),
        with: {
          songs: {
            orderBy: (songs, { asc }) => [asc(songs.position)],
          },
        },
      });

      if (!result) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Queue not found" });
      }

      // Extract Spotify track IDs from URIs (spotify:track:XXXX → XXXX)
      const seedTrackIds = result.songs
        .filter((s) => s.spotifyUri)
        .map((s) => s.spotifyUri!.replace("spotify:track:", ""))
        .slice(0, 5);

      if (seedTrackIds.length === 0) return [];

      const { accessToken } = await getClientCredentialsToken();
      return getRecommendations(seedTrackIds, accessToken, 10);
    }),
});
