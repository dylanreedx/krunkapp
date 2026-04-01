import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { eq } from "drizzle-orm";

import { env } from "@/env";
import { db } from "@/server/db";
import { user } from "@/server/db/schema";

const AVATAR_IDS = [
  "smile-pink",
  "cool-black",
  "wink-outline",
  "open-pink",
  "flat-gray",
  "wide-black",
  "tongue-pink",
  "lines-outline",
] as const;

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? "http://127.0.0.1:3000",
  database: drizzleAdapter(db, {
    provider: "sqlite",
  }),
  socialProviders: {
    ...(env.SPOTIFY_CLIENT_ID && env.SPOTIFY_CLIENT_SECRET
      ? {
          spotify: {
            clientId: env.SPOTIFY_CLIENT_ID,
            clientSecret: env.SPOTIFY_CLIENT_SECRET,
            scope: [
              "user-read-private",
              "playlist-modify-public",
              "playlist-modify-private",
              "ugc-image-upload",
            ],
          },
        }
      : {}),
  },
  databaseHooks: {
    account: {
      create: {
        after: async (account) => {
          const randomAvatar =
            AVATAR_IDS[Math.floor(Math.random() * AVATAR_IDS.length)];

          if (account.providerId === "spotify") {
            await db
              .update(user)
              .set({
                platformPreference: "spotify",
                spotifyId: account.accountId,
                avatarId: randomAvatar,
              })
              .where(eq(user.id, account.userId));
          } else {
            await db
              .update(user)
              .set({ avatarId: randomAvatar })
              .where(eq(user.id, account.userId));
          }
        },
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
