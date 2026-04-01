import { eq } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { user } from "@/server/db/schema";

export const userRouter = createTRPCRouter({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const [profile] = await ctx.db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        avatarId: user.avatarId,
        displayName: user.displayName,
        phoneNumber: user.phoneNumber,
        platformPreference: user.platformPreference,
        spotifyId: user.spotifyId,
        appleMusicId: user.appleMusicId,
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    return profile ?? null;
  }),

  setAvatar: protectedProcedure
    .input(z.object({ avatarId: z.string().min(1).max(50) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      await ctx.db
        .update(user)
        .set({ avatarId: input.avatarId })
        .where(eq(user.id, userId));
      return { success: true };
    }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        displayName: z.string().min(1).max(255).optional(),
        avatarId: z.string().min(1).max(50).optional(),
        phoneNumber: z
          .string()
          .max(20)
          .regex(/^\+?[\d\s()-]*$/, "Invalid phone number format")
          .optional()
          .or(z.literal("")),
        dropDay: z.enum(["friday", "sunday"]).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const updates: Record<string, string | null> = {};
      if (input.displayName !== undefined)
        updates.displayName = input.displayName;
      if (input.avatarId !== undefined) updates.avatarId = input.avatarId;
      if (input.phoneNumber !== undefined)
        updates.phoneNumber = input.phoneNumber || null;
      if (input.dropDay !== undefined) updates.dropDay = input.dropDay;

      if (Object.keys(updates).length === 0) {
        return { success: true };
      }

      await ctx.db.update(user).set(updates).where(eq(user.id, userId));

      return { success: true };
    }),
});
