"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { House, Plus, GearSix, Tray, MusicNote } from "@phosphor-icons/react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";

type Tab = "drafts" | "sent" | "received";

export function QueueList({ userId }: { userId: string }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("drafts");
  const [queues] = api.queue.list.useSuspenseQuery();
  const utils = api.useUtils();

  const createQueue = api.queue.create.useMutation({
    onSuccess: (data) => {
      if (data) {
        router.push(`/queue/${data.id}/edit`);
      }
    },
  });

  const myDrafts = queues.filter(
    (q) => q.creatorId === userId && q.status === "draft",
  );
  const mySent = queues.filter(
    (q) => q.creatorId === userId && q.status === "published",
  );
  const received = queues.filter((q) => q.creatorId !== userId);

  const tabQueues =
    activeTab === "drafts"
      ? myDrafts
      : activeTab === "sent"
        ? mySent
        : received;

  return (
    <div className="space-y-7">
      {/* Create button (desktop) */}
      <div className="animate-[fade-up_0.5s_cubic-bezier(0.16,1,0.3,1)_0.65s_both] max-md:hidden">
        <Button
          onClick={() => createQueue.mutate()}
          disabled={createQueue.isPending}
          size="lg"
          className="rounded-[18px] px-9 py-4.5 text-base"
        >
          {createQueue.isPending ? "Creating..." : "New queue +"}
        </Button>
      </div>

      {/* Segmented control */}
      <div className="animate-[fade-up_0.5s_cubic-bezier(0.16,1,0.3,1)_0.72s_both]">
        <div className="inline-flex rounded-full border-[3px] border-black p-1">
          {(["drafts", "sent", "received"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`cursor-pointer rounded-full px-6 py-2.5 font-display text-sm font-bold capitalize transition-all ${
                activeTab === tab
                  ? "bg-pink text-white"
                  : "bg-transparent text-black hover:bg-gray-100"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Queue grid / empty state */}
      {tabQueues.length === 0 ? (
        <EmptyState tab={activeTab} />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {tabQueues.map((queue, i) => (
            <QueueCard
              key={queue.id}
              queue={queue}
              index={i}
              isDraft={activeTab === "drafts"}
              isReceived={activeTab === "received"}
              onClick={() =>
                activeTab === "drafts"
                  ? router.push(`/queue/${queue.id}/edit`)
                  : undefined
              }
            />
          ))}
        </div>
      )}

      {/* Mobile bottom nav */}
      <MobileNav
        onCreateClick={() => createQueue.mutate()}
        isCreating={createQueue.isPending}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Queue card                                                         */
/* ------------------------------------------------------------------ */

type QueueRow = {
  id: string;
  creatorId: string;
  aiName: string | null;
  aiCoverUrl: string | null;
  status: string;
  publishedAt: Date | null;
  weekStartDate: string;
  createdAt: Date;
  updatedAt: Date | null;
  songCount: number;
  recipientCount: number;
};

const TILT_CLASSES = [
  "sm:rotate-[1.2deg] sm:hover:rotate-[1.2deg]",
  "",
  "sm:rotate-[-0.8deg] sm:hover:rotate-[-0.8deg]",
  "",
] as const;

const THUMB_COLORS = [
  ["bg-pink border-pink", "bg-black border-black", "bg-gray-200 border-black"],
  ["bg-gray-200 border-black", "bg-pink border-pink", "bg-gray-300 border-black"],
  ["bg-black border-black", "bg-pink border-pink", "bg-gray-200 border-black"],
  ["bg-pink border-pink", "bg-gray-300 border-black", "bg-black border-black"],
] as const;

function QueueCard({
  queue,
  index,
  isDraft,
  isReceived,
  onClick,
}: {
  queue: QueueRow;
  index: number;
  isDraft?: boolean;
  isReceived?: boolean;
  onClick?: () => void;
}) {
  const weekLabel = formatWeekLabel(queue.weekStartDate);
  const tilt = TILT_CLASSES[index % TILT_CLASSES.length];
  const thumbs = THUMB_COLORS[index % THUMB_COLORS.length]!;
  const delay = `${(index * 0.08).toFixed(2)}s`;

  return (
    <div
      onClick={onClick}
      style={{ animationDelay: delay }}
      className={`relative animate-[fade-up_0.45s_cubic-bezier(0.16,1,0.3,1)_both] cursor-pointer overflow-hidden rounded-[var(--radius-xl)] border-[3px] border-black bg-white p-[22px] transition-transform hover:-translate-y-1 ${tilt}`}
    >
      {/* Album art thumbnails */}
      <div className="mb-4 flex">
        {thumbs.map((color, i) => (
          <div
            key={i}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border-[2.5px] ${color} ${i > 0 ? "-ml-3" : ""}`}
          />
        ))}
      </div>

      {/* Name */}
      <div className="mb-1.5 font-display text-lg font-black leading-tight">
        {queue.aiName ?? "Untitled"}
      </div>

      {/* Meta */}
      <div className="mb-3.5 font-body text-[0.8rem] font-medium text-gray-500">
        {weekLabel} &middot; {queue.songCount}{" "}
        {queue.songCount === 1 ? "song" : "songs"}
      </div>

      {/* Status badge */}
      <div className="flex items-center gap-2.5">
        {isDraft ? (
          <Badge variant="outline">Draft</Badge>
        ) : isReceived ? (
          <Badge variant="black">Received</Badge>
        ) : (
          <Badge variant="pink">Dropped</Badge>
        )}
      </div>

      {/* Progress bar on drafts */}
      {isDraft && (
        <div className="absolute bottom-0 left-0 right-0 h-1 overflow-hidden rounded-b-[19px] bg-gray-100">
          <div
            className="h-full rounded-r-sm bg-pink transition-[width] duration-700"
            style={{
              width: `${Math.min(100, (queue.songCount / 7) * 100)}%`,
            }}
          />
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Empty state                                                        */
/* ------------------------------------------------------------------ */

function EmptyState({ tab }: { tab: Tab }) {
  const messages: Record<Tab, { heading: string; sub: string }> = {
    drafts: {
      heading: "No drafts yet",
      sub: "Start a new queue and add songs throughout the week.",
    },
    sent: {
      heading: "No drops yet",
      sub: "When you publish a queue, it shows up here.",
    },
    received: {
      heading: "No drops yet",
      sub: "When your friends send you music, it lands here.",
    },
  };
  const msg = messages[tab];
  return (
    <div className="py-20 text-center">
      <span className="mb-5 block opacity-70">
        {tab === "received" ? <Tray weight="light" size={48} className="mx-auto text-gray-400" /> : <MusicNote weight="light" size={48} className="mx-auto text-gray-400" />}
      </span>
      <h2 className="mb-3 font-display text-[clamp(1.6rem,4vw,2.4rem)] font-black leading-tight">
        {msg.heading}
      </h2>
      <p className="mx-auto max-w-[360px] font-body text-base font-medium leading-relaxed text-gray-500">
        {msg.sub}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mobile bottom nav                                                  */
/* ------------------------------------------------------------------ */

function MobileNav({
  onCreateClick,
  isCreating,
}: {
  onCreateClick: () => void;
  isCreating: boolean;
}) {
  return (
    <nav className="safe-area-bottom fixed bottom-0 left-0 right-0 z-[200] flex items-end justify-around border-t-[3px] border-black bg-white/95 px-0 py-3 backdrop-blur-xl rounded-t-[20px] md:hidden">
      <Link href="/dashboard" className="flex flex-col items-center gap-1">
        <House weight="fill" size={24} className="text-pink" />
        <span className="font-body text-[0.65rem] font-semibold text-pink">
          Home
        </span>
      </Link>

      <button
        type="button"
        onClick={onCreateClick}
        disabled={isCreating}
        className="flex cursor-pointer flex-col items-center gap-1"
      >
        <div className="-mt-[30px] flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-black bg-pink transition-transform active:scale-[0.92]">
          <Plus weight="bold" size={24} className="text-white" />
        </div>
        <span className="font-body text-[0.65rem] font-semibold text-gray-500">
          Create
        </span>
      </button>

      <Link href="/settings" className="flex flex-col items-center gap-1">
        <GearSix weight="regular" size={24} className="text-gray-500" />
        <span className="font-body text-[0.65rem] font-semibold text-gray-500">
          Settings
        </span>
      </Link>
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatWeekLabel(weekStartDate: string): string {
  try {
    const date = new Date(weekStartDate + "T00:00:00");
    return `Week of ${date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })}`;
  } catch {
    return weekStartDate;
  }
}
