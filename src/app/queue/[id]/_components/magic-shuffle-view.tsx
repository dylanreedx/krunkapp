"use client";

import Image from "next/image";
import { getPlatformLink } from "@/lib/deeplinks";
import { useViewMode } from "./view-toggle";
import { SongRow } from "./song-list-view";
import { api } from "@/trpc/react";
import { cn } from "@/lib/utils";
import { CaretRight, Sparkle } from "@phosphor-icons/react";
import type { RecommendedTrack } from "@/lib/recommendations";

type Song = {
  id: string;
  title: string;
  artist: string;
  album: string | null;
  albumArtUrl: string | null;
  spotifyUri: string | null;
  appleMusicId: string | null;
  earlyDrop: boolean;
  position: number;
};

type MagicShuffleViewProps = {
  queueId: string;
  songs: Song[];
  isLoggedIn: boolean;
  platform?: "spotify" | "apple_music";
};

type InterleavedItem =
  | { type: "queued"; song: Song; index: number }
  | { type: "recommended"; track: RecommendedTrack };

function interleave(
  songs: Song[],
  recommendations: RecommendedTrack[],
): InterleavedItem[] {
  const items: InterleavedItem[] = [];
  let recIdx = 0;

  for (let i = 0; i < songs.length; i++) {
    items.push({ type: "queued", song: songs[i]!, index: i + 1 });

    // After every 2 queued songs (or every 1 if queue is small), insert a recommendation
    const interval = songs.length <= 4 ? 1 : 2;
    if ((i + 1) % interval === 0 && recIdx < recommendations.length) {
      items.push({ type: "recommended", track: recommendations[recIdx]! });
      recIdx++;
    }
  }

  // Append any remaining recommendations at the end
  while (recIdx < recommendations.length) {
    items.push({ type: "recommended", track: recommendations[recIdx]! });
    recIdx++;
  }

  return items;
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div className="h-7 w-7 shrink-0 animate-pulse rounded-full bg-gray-200" />
      <div className="h-11 w-11 shrink-0 animate-pulse rounded-[10px] bg-gray-200" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-3/4 animate-pulse rounded bg-gray-200" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-gray-200" />
      </div>
    </div>
  );
}

function RecommendedRow({
  track,
  isLoggedIn,
  platform,
  isLast,
}: {
  track: RecommendedTrack;
  isLoggedIn: boolean;
  platform?: "spotify" | "apple_music";
  isLast: boolean;
}) {
  const handleOpen = () => {
    if (!isLoggedIn || !platform) return;
    // Build a song-like object for getPlatformLink
    const songLike = {
      spotifyUri: track.spotifyUri,
      appleMusicId: null as string | null,
    };
    const link = getPlatformLink(songLike, platform);
    if (link) {
      window.open(link.appLink, "_blank");
      setTimeout(() => {
        window.open(link.webLink, "_blank");
      }, 1500);
    }
  };

  return (
    <button
      type="button"
      onClick={handleOpen}
      disabled={!isLoggedIn}
      className={cn(
        "group flex w-full items-center gap-3 bg-white px-4 py-3.5 text-left opacity-70 transition-all duration-200 hover:opacity-100 hover:translate-x-1 active:translate-x-0 disabled:cursor-default disabled:hover:translate-x-0",
        !isLast && "border-b border-gray-200",
      )}
    >
      {/* Suggested badge instead of position number */}
      <div className="flex h-7 shrink-0 items-center justify-center gap-1 rounded-full bg-pink/20 px-2.5 font-display text-[0.6rem] font-bold tracking-wide text-pink">
        <Sparkle weight="fill" size={12} />
        Suggested
      </div>

      {/* Album art with dashed border */}
      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-[10px] border-3 border-dashed border-pink/40">
        {track.albumArtUrl ? (
          <Image
            src={track.albumArtUrl}
            alt={`${track.title} by ${track.artist}`}
            width={44}
            height={44}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-800 to-gray-600">
            <span className="font-display text-xs font-bold text-white">
              {track.title.charAt(0)}
            </span>
          </div>
        )}
      </div>

      {/* Song info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-display text-[0.82rem] font-bold leading-tight">
            {track.title}
          </h3>
        </div>
        <p className="truncate font-body text-[0.78rem] font-medium text-gray-500">
          {track.artist}
        </p>
      </div>

      {/* Spotify icon + chevron */}
      <div className="flex shrink-0 items-center gap-2">
        {track.spotifyUri && (
          <div className="opacity-40 transition-opacity group-hover:opacity-100">
            <svg className="h-[22px] w-[22px] text-[#1DB954]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
            </svg>
          </div>
        )}
        <CaretRight weight="bold" size={14} className="text-gray-300 transition-all group-hover:translate-x-0.5 group-hover:text-gray-500" />
      </div>
    </button>
  );
}

export function MagicShuffleView({
  queueId,
  songs,
  isLoggedIn,
  platform,
}: MagicShuffleViewProps) {
  const { mode } = useViewMode();

  const {
    data: recommendations,
    isLoading,
    isError,
  } = api.queue.getRecommendations.useQuery(
    { queueId },
    {
      enabled: mode === "magic",
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  );

  if (mode !== "magic") return null;

  // Loading state
  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-[var(--radius-xl)] border-3 border-black">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={cn(i < 5 && "border-b border-gray-200")}
          >
            <SkeletonRow />
          </div>
        ))}
      </div>
    );
  }

  // Error or empty recommendations — fall back to normal queue
  const recs = isError || !recommendations?.length ? [] : recommendations;

  const items = recs.length > 0 ? interleave(songs, recs) : [];
  const showFallback = recs.length === 0;

  return (
    <div>
      {showFallback && (
        <p className="mb-3 text-center font-body text-[0.78rem] font-medium text-gray-400">
          Couldn&apos;t find suggestions — showing your queue
        </p>
      )}
      <div className="overflow-hidden rounded-[var(--radius-xl)] border-3 border-black">
        {showFallback
          ? songs.map((song, i) => (
              <SongRow
                key={song.id}
                song={song}
                index={i + 1}
                isLoggedIn={isLoggedIn}
                platform={platform}
                isLast={i === songs.length - 1}
              />
            ))
          : items.map((item, i) =>
              item.type === "queued" ? (
                <SongRow
                  key={`q-${item.song.id}`}
                  song={item.song}
                  index={item.index}
                  isLoggedIn={isLoggedIn}
                  platform={platform}
                  isLast={i === items.length - 1}
                />
              ) : (
                <RecommendedRow
                  key={`r-${item.track.id}`}
                  track={item.track}
                  isLoggedIn={isLoggedIn}
                  platform={platform}
                  isLast={i === items.length - 1}
                />
              ),
            )}
      </div>
    </div>
  );
}
