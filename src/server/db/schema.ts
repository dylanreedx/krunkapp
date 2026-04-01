import { relations, sql } from "drizzle-orm";
import { index, sqliteTable, uniqueIndex } from "drizzle-orm/sqlite-core";

/**
 * Multi-project schema prefix helper
 */

// ============================================
// Krunk domain tables
// ============================================

// Queues — the first-class object
export const queue = sqliteTable(
  "krunked_queue",
  (d) => ({
    id: d
      .text({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    creatorId: d
      .text({ length: 255 })
      .notNull()
      .references(() => user.id),
    aiName: d.text({ length: 255 }),
    aiCoverUrl: d.text({ length: 1024 }),
    status: d
      .text({ length: 20, enum: ["draft", "published"] })
      .notNull()
      .default("draft"),
    publishedAt: d.integer({ mode: "timestamp" }),
    weekStartDate: d.text({ length: 10 }).notNull(), // ISO date string YYYY-MM-DD
    createdAt: d
      .integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: d.integer({ mode: "timestamp" }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("queue_creator_idx").on(t.creatorId),
    index("queue_status_idx").on(t.status),
    index("queue_week_idx").on(t.weekStartDate),
  ],
);

export const queueRelations = relations(queue, ({ one, many }) => ({
  creator: one(user, { fields: [queue.creatorId], references: [user.id] }),
  songs: many(queueSong),
  recipients: many(queueRecipient),
}));

// Queue Songs
export const queueSong = sqliteTable(
  "krunked_queue_song",
  (d) => ({
    id: d
      .text({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    queueId: d
      .text({ length: 255 })
      .notNull()
      .references(() => queue.id, { onDelete: "cascade" }),
    isrcCode: d.text({ length: 20 }),
    title: d.text({ length: 500 }).notNull(),
    artist: d.text({ length: 500 }).notNull(),
    album: d.text({ length: 500 }),
    albumArtUrl: d.text({ length: 1024 }),
    spotifyUri: d.text({ length: 255 }),
    appleMusicId: d.text({ length: 255 }),
    audioFeatures: d.text({ mode: "json" }),
    position: d.integer({ mode: "number" }).notNull().default(0),
    earlyDrop: d.integer({ mode: "boolean" }).notNull().default(false),
    earlyDroppedAt: d.integer({ mode: "timestamp" }),
    matchStatus: d
      .text({ length: 20, enum: ["matched", "unmatched", "partial"] })
      .default("matched"),
    createdAt: d
      .integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
  }),
  (t) => [
    index("queue_song_queue_idx").on(t.queueId),
    index("queue_song_position_idx").on(t.queueId, t.position),
  ],
);

export const queueSongRelations = relations(queueSong, ({ one }) => ({
  queue: one(queue, { fields: [queueSong.queueId], references: [queue.id] }),
}));

// Queue Recipients
// A recipient is identified by EITHER userId OR phoneNumber (or both once they sign up).
export const queueRecipient = sqliteTable(
  "krunked_queue_recipient",
  (d) => ({
    id: d
      .text({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    queueId: d
      .text({ length: 255 })
      .notNull()
      .references(() => queue.id, { onDelete: "cascade" }),
    userId: d
      .text({ length: 255 })
      .references(() => user.id),
    phoneNumber: d.text({ length: 20 }),
    platformPlaylistId: d.text({ length: 255 }),
    platformPlaylistUrl: d.text({ length: 1024 }),
    createdAt: d
      .integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
  }),
  (t) => [
    index("queue_recipient_queue_idx").on(t.queueId),
    index("queue_recipient_user_idx").on(t.userId),
    index("queue_recipient_phone_idx").on(t.phoneNumber),
    uniqueIndex("queue_recipient_unique_idx").on(t.queueId, t.userId),
    uniqueIndex("queue_recipient_phone_unique_idx").on(t.queueId, t.phoneNumber),
  ],
);

export const queueRecipientRelations = relations(
  queueRecipient,
  ({ one }) => ({
    queue: one(queue, {
      fields: [queueRecipient.queueId],
      references: [queue.id],
    }),
    user: one(user, {
      fields: [queueRecipient.userId],
      references: [user.id],
    }),
  }),
);

// Friendships — established via queue sharing
export const friendship = sqliteTable(
  "krunked_friendship",
  (d) => ({
    id: d
      .text({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: d
      .text({ length: 255 })
      .notNull()
      .references(() => user.id),
    friendId: d
      .text({ length: 255 })
      .notNull()
      .references(() => user.id),
    createdAt: d
      .integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
  }),
  (t) => [
    uniqueIndex("friendship_unique_idx").on(t.userId, t.friendId),
    index("friendship_user_idx").on(t.userId),
    index("friendship_friend_idx").on(t.friendId),
  ],
);

export const friendshipRelations = relations(friendship, ({ one }) => ({
  user: one(user, {
    fields: [friendship.userId],
    references: [user.id],
    relationName: "initiator",
  }),
  friend: one(user, {
    fields: [friendship.friendId],
    references: [user.id],
    relationName: "friend",
  }),
}));

// Better Auth core tables (extended with Krunk fields)
export const user = sqliteTable("user", (d) => ({
  id: d
    .text({ length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: d.text({ length: 255 }),
  email: d.text({ length: 255 }).notNull().unique(),
  emailVerified: d.integer({ mode: "boolean" }).default(false),
  image: d.text({ length: 255 }),
  // Krunk-specific fields
  avatarId: d.text({ length: 50 }).default("smile-pink"),
  displayName: d.text({ length: 255 }),
  phoneNumber: d.text({ length: 20 }),
  platformPreference: d.text({ length: 20, enum: ["spotify", "apple_music"] }),
  dropDay: d.text({ length: 10, enum: ["friday", "sunday"] }).default("friday"),
  spotifyId: d.text({ length: 255 }),
  appleMusicId: d.text({ length: 255 }),
  createdAt: d
    .integer({ mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: d.integer({ mode: "timestamp" }).$onUpdate(() => new Date()),
}));

export const userRelations = relations(user, ({ many }) => ({
  account: many(account),
  session: many(session),
  createdQueues: many(queue),
  receivedQueues: many(queueRecipient),
  friendshipsInitiated: many(friendship, { relationName: "initiator" }),
  friendshipsReceived: many(friendship, { relationName: "friend" }),
}));

export const account = sqliteTable(
  "account",
  (d) => ({
    id: d
      .text({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: d
      .text({ length: 255 })
      .notNull()
      .references(() => user.id),
    accountId: d.text({ length: 255 }).notNull(),
    providerId: d.text({ length: 255 }).notNull(),
    accessToken: d.text(),
    refreshToken: d.text(),
    accessTokenExpiresAt: d.integer({ mode: "timestamp" }),
    refreshTokenExpiresAt: d.integer({ mode: "timestamp" }),
    scope: d.text({ length: 255 }),
    idToken: d.text(),
    password: d.text(),
    createdAt: d
      .integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: d.integer({ mode: "timestamp" }).$onUpdate(() => new Date()),
  }),
  (t) => [index("account_user_id_idx").on(t.userId)],
);

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const session = sqliteTable(
  "session",
  (d) => ({
    id: d
      .text({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: d
      .text({ length: 255 })
      .notNull()
      .references(() => user.id),
    token: d.text({ length: 255 }).notNull().unique(),
    expiresAt: d.integer({ mode: "timestamp" }).notNull(),
    ipAddress: d.text({ length: 255 }),
    userAgent: d.text({ length: 255 }),
    createdAt: d
      .integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: d.integer({ mode: "timestamp" }).$onUpdate(() => new Date()),
  }),
  (t) => [index("session_user_id_idx").on(t.userId)],
);

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const verification = sqliteTable(
  "verification",
  (d) => ({
    id: d
      .text({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    identifier: d.text({ length: 255 }).notNull(),
    value: d.text({ length: 255 }).notNull(),
    expiresAt: d.integer({ mode: "timestamp" }).notNull(),
    createdAt: d
      .integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: d.integer({ mode: "timestamp" }).$onUpdate(() => new Date()),
  }),
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);
