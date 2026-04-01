import Link from "next/link";
import Image from "next/image";
import { CaretLeft } from "@phosphor-icons/react/dist/ssr";

import { requireAuth } from "@/lib/auth-guard";
import { api } from "@/trpc/server";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Archive | Krunk",
};

export default async function ArchivePage() {
  const session = await requireAuth("/dashboard/archive");

  const queues = await api.queue.list({ status: "published" });

  return (
    <div className="dot-grid relative min-h-screen bg-white">
      <div className="pointer-events-none fixed inset-0 z-0 bg-white/[0.96]" />

      {/* Top bar */}
      <nav className="relative z-10 flex items-center justify-between border-b-3 border-black px-6 py-4 md:px-12">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wide text-gray-600 transition-colors hover:text-black"
        >
          <CaretLeft weight="bold" size={18} className="shrink-0" />
          Dashboard
        </Link>
        <span className="font-display text-xl font-extrabold uppercase tracking-tight">
          krunk
        </span>
        <div className="w-[100px]" />
      </nav>

      {/* Content */}
      <main className="relative z-10 mx-auto max-w-5xl px-6 py-10 md:px-12">
        <div className="mb-10">
          <h1 className="font-display text-4xl font-extrabold uppercase tracking-tighter md:text-5xl">
            Archive
          </h1>
          <p className="mt-2 font-body text-gray-600">
            Every queue you&apos;ve sent or received.
          </p>
        </div>

        {queues.length === 0 ? (
          <div className="rounded-[var(--radius-xl)] border-3 border-dashed border-gray-300 px-6 py-16 text-center">
            <p className="font-display text-lg font-bold uppercase text-gray-400">
              No published queues yet
            </p>
            <p className="mt-2 font-body text-sm text-gray-400">
              Once you or your friends publish a queue, it will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {queues.map((q) => (
              <ArchiveCard
                key={q.id}
                id={q.id}
                aiName={q.aiName}
                aiCoverUrl={q.aiCoverUrl}
                weekStartDate={q.weekStartDate}
                songCount={q.songCount}
                isOwned={q.creatorId === session.user.id}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function ArchiveCard({
  id,
  aiName,
  aiCoverUrl,
  weekStartDate,
  songCount,
  isOwned,
}: {
  id: string;
  aiName: string | null;
  aiCoverUrl: string | null;
  weekStartDate: string;
  songCount: number;
  isOwned: boolean;
}) {
  const weekLabel = formatWeekLabel(weekStartDate);

  return (
    <Link
      href={`/queue/${id}`}
      className="group overflow-hidden rounded-[var(--radius-xl)] border-3 border-black bg-white transition-all active:scale-[0.98]"
    >
      {/* Cover */}
      <div className="relative aspect-[16/9] w-full overflow-hidden">
        {aiCoverUrl ? (
          <Image
            src={aiCoverUrl}
            alt={aiName ?? "Queue cover"}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, 50vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-pink">
            <span className="px-4 text-center font-display text-2xl font-extrabold uppercase leading-tight text-white/90">
              {aiName ?? "Queue"}
            </span>
          </div>
        )}
        {/* Owned / received badge */}
        <span
          className={`absolute left-3 top-3 rounded-[var(--radius-sm)] px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-widest ${
            isOwned
              ? "bg-black/70 text-white"
              : "bg-white/90 text-black"
          }`}
        >
          {isOwned ? "Sent" : "Received"}
        </span>
      </div>

      {/* Info */}
      <div className="border-t-3 border-black p-4">
        <p className="truncate font-display text-base font-bold leading-tight group-hover:text-pink">
          {aiName ?? "Untitled"}
        </p>
        <div className="mt-2 flex items-center justify-between">
          <span className="font-body text-xs text-gray-500">{weekLabel}</span>
          <Badge variant="outline" className="text-[10px]">
            {songCount} {songCount === 1 ? "song" : "songs"}
          </Badge>
        </div>
      </div>
    </Link>
  );
}

function formatWeekLabel(weekStartDate: string): string {
  try {
    const date = new Date(weekStartDate + "T00:00:00");
    return `Wk of ${date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })}`;
  } catch {
    return weekStartDate;
  }
}
