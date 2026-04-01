import { type Metadata } from "next";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { queue, queueRecipient, user } from "@/server/db/schema";
import { getSession } from "@/server/better-auth/server";

import { QueueCover } from "./_components/queue-cover";
import { QueueContent } from "./_components/queue-content";
import { SignInCta } from "./_components/sign-in-cta";
import { DraftPreview } from "./_components/draft-preview";

type Props = {
  params: Promise<{ id: string }>;
};

async function getQueue(id: string) {
  const result = await db.query.queue.findFirst({
    where: eq(queue.id, id),
    with: {
      songs: {
        orderBy: (songs, { asc }) => [asc(songs.position)],
      },
      recipients: true,
    },
  });

  if (!result) return null;

  const creator = await db.query.user.findFirst({
    where: eq(user.id, result.creatorId),
    columns: {
      id: true,
      name: true,
      displayName: true,
      image: true,
      avatarId: true,
    },
  });

  return { ...result, creator };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = await getQueue(id);

  if (!data) {
    return { title: "Queue not found | Krunk" };
  }

  const songCount = data.songs.length;
  const senderName =
    data.creator?.displayName ?? data.creator?.name ?? "Someone";
  const description = `${songCount} song${songCount !== 1 ? "s" : ""} from ${senderName}`;

  return {
    title: `${data.aiName ?? "Queue"} | Krunk`,
    description,
    openGraph: {
      title: data.aiName ?? "Queue",
      description,
      ...(data.aiCoverUrl ? { images: [{ url: data.aiCoverUrl }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: data.aiName ?? "Queue",
      description,
      ...(data.aiCoverUrl ? { images: [data.aiCoverUrl] } : {}),
    },
  };
}

export default async function QueueViewPage({ params }: Props) {
  const { id } = await params;
  const data = await getQueue(id);

  if (!data) notFound();

  const session = await getSession();
  const isLoggedIn = !!session?.user;

  // Redirect to onboarding if logged in but no display name
  if (isLoggedIn) {
    const userData = await db.query.user.findFirst({
      where: eq(user.id, session.user.id),
      columns: { displayName: true },
    });
    if (!userData?.displayName) {
      const { redirect } = await import("next/navigation");
      redirect(`/onboarding?redirect=/queue/${id}`);
    }
  }

  // Auto-add as listener if logged in and not already a listener
  if (isLoggedIn && session.user.id !== data.creatorId) {
    const existing = await db.query.queueRecipient.findFirst({
      where: and(
        eq(queueRecipient.queueId, id),
        eq(queueRecipient.userId, session.user.id),
      ),
    });
    if (!existing) {
      await db.insert(queueRecipient).values({
        queueId: id,
        userId: session.user.id,
      }).onConflictDoNothing();
    }
  }

  const senderName =
    data.creator?.displayName ?? data.creator?.name ?? "Someone";
  const senderAvatarId = data.creator?.avatarId ?? "smile-pink";

  const formattedWeek = new Date(
    data.weekStartDate + "T00:00:00",
  ).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  const isDraft = data.status === "draft";

  return (
    <main className="relative min-h-screen bg-white">
      <div className="dot-grid pointer-events-none fixed inset-0 z-0 opacity-[0.04]" />

      <div className="relative z-[1] mx-auto max-w-[520px] px-5 pb-24 pt-4 safe-area-top md:max-w-[560px]">
        <header className="flex items-center justify-center py-4">
          <span className="font-display text-[1.3rem] font-black tracking-tight">
            krun<span className="text-pink">k</span>
          </span>
        </header>

        {isDraft ? (
          /* ---- Draft: blurred anticipation view ---- */
          <DraftPreview
            senderName={senderName}
            senderAvatarId={senderAvatarId}
            aiCoverUrl={data.aiCoverUrl}
            songs={data.songs.map((s) => ({ id: s.id, albumArtUrl: s.albumArtUrl }))}
            songCount={data.songs.length}
            weekDate={formattedWeek}
            isLoggedIn={isLoggedIn}
          />
        ) : (
          /* ---- Published: full queue view ---- */
          <>
            <QueueCover
              aiName={data.aiName}
              aiCoverUrl={data.aiCoverUrl}
              senderName={senderName}
              senderAvatarId={senderAvatarId}
              songCount={data.songs.length}
              weekDate={formattedWeek}
            />

            <QueueContent
              queueId={id}
              songs={data.songs}
              isLoggedIn={isLoggedIn}
              senderName={senderName}
              senderAvatarId={senderAvatarId}
              platform={
                (session?.user as { platformPreference?: string } | undefined)
                  ?.platformPreference as "spotify" | "apple_music" | undefined
              }
            />

            {!isLoggedIn && (
              <SignInCta
                senderName={senderName}
                senderAvatarId={senderAvatarId}
              />
            )}
          </>
        )}

        <footer className="pb-9 pt-10 text-center safe-area-bottom">
          <p className="font-body text-[0.78rem] font-medium text-gray-400">
            Powered by{" "}
            <strong className="font-display font-bold text-black">krunk</strong>
          </p>
          <p className="font-body text-[0.72rem] font-medium tracking-wide text-gray-300">
            getcrunk.app
          </p>
        </footer>
      </div>
    </main>
  );
}
