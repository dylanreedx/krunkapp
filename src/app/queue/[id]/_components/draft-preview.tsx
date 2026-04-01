"use client";

import { Avatar } from "@/components/ui/avatar";
import { HoloCover } from "@/components/ui/holo-cover";
import { WeekStrip } from "@/components/ui/week-strip";
import { AppleMusicAuth } from "@/components/apple-music-auth";
import { authClient } from "@/server/better-auth/client";

export function DraftPreview({
  senderName,
  senderAvatarId,
  aiCoverUrl,
  songs,
  songCount,
  weekDate,
  isLoggedIn,
}: {
  senderName: string;
  senderAvatarId: string;
  aiCoverUrl: string | null;
  songs: { id: string; albumArtUrl: string | null }[];
  songCount: number;
  weekDate: string;
  isLoggedIn: boolean;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      {/* Sender strip */}
      <div className="flex items-center gap-3 pb-4 pt-2">
        <Avatar avatarId={senderAvatarId} size="md" />
        <p className="font-body text-[0.92rem] font-medium text-gray-500">
          <strong className="font-bold text-black">{senderName}</strong> is
          making you something
        </p>
      </div>

      {/* Sign-in CTA — prominent, before the teaser content */}
      {!isLoggedIn && (
        <div className="mb-8 w-full">
          <div className="rounded-[var(--radius-xl)] border-3 border-black bg-white p-6 text-center">
            <p className="font-display text-base font-black">
              Sign up to listen when it drops
            </p>
            <p className="mt-1 font-body text-sm text-gray-500">
              {senderName} is putting together a queue just for you
            </p>
            <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() =>
                  authClient.signIn.social({
                    provider: "spotify",
                    callbackURL: typeof window !== "undefined" ? window.location.href : "/",
                  })
                }
                className="inline-flex items-center justify-center gap-2.5 rounded-[var(--radius-md)] bg-pink px-6 py-3.5 font-display text-sm font-bold text-white transition-all active:scale-[0.97]"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                </svg>
                Continue with Spotify
              </button>
              <AppleMusicAuth callbackURL={typeof window !== "undefined" ? window.location.href : "/"} />
            </div>
          </div>
        </div>
      )}

      {/* Blurred holographic cover preview */}
      <div className="relative w-full max-w-[340px]">
        {aiCoverUrl ? (
          <HoloCover
            src={aiCoverUrl}
            size={340}
            blurred
            interactive
            className="mx-auto"
          />
        ) : (
          <div className="mx-auto aspect-square w-full max-w-[340px] overflow-hidden rounded-[24px] border-3 border-black">
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1a1a2e] via-[#0f3460] to-[#111]">
              <span className="font-display text-5xl font-black text-white/10">
                ?
              </span>
            </div>
            <div className="absolute inset-0 z-[2] flex flex-col items-center justify-center">
              <div className="rounded-[var(--radius-lg)] bg-black/60 px-6 py-4 backdrop-blur-sm">
                <p className="font-display text-lg font-black text-white">
                  Dropping soon
                </p>
                <p className="mt-1 font-body text-sm text-white/60">
                  {songCount} song{songCount !== 1 ? "s" : ""} &middot; Week of{" "}
                  {weekDate}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Track count sticker */}
        <div className="absolute -right-1.5 top-4 z-[3] -rotate-[8deg] rounded-full border-3 border-black bg-pink px-3.5 py-1.5 font-display text-[0.68rem] font-bold tracking-wide text-white">
          {songCount} track{songCount !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Week strip countdown */}
      <div className="mt-8 w-full">
        <WeekStrip dropDay="friday" />
      </div>

      {/* Blurred song list — real album art, hidden details */}
      <div className="mt-8 w-full overflow-hidden rounded-[var(--radius-xl)] border-3 border-black">
        {songs.map((song, i) => (
          <div
            key={song.id}
            className="flex items-center gap-3.5 border-b border-gray-100 px-5 py-3.5 last:border-b-0"
          >
            {/* Position circle */}
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-200 font-display text-[10px] font-bold text-gray-400">
              {i + 1}
            </div>

            {/* Album art — blurred */}
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-[10px] border-2 border-gray-200">
              {song.albumArtUrl ? (
                <img
                  src={song.albumArtUrl}
                  alt=""
                  className="h-full w-full scale-[1.2] object-cover blur-[6px] saturate-[1.3]"
                />
              ) : (
                <div className="h-full w-full bg-gray-200" />
              )}
            </div>

            {/* Blurred text placeholders */}
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 rounded-full bg-gray-200" style={{ width: `${45 + (i * 13) % 35}%` }} />
              <div className="h-2.5 rounded-full bg-gray-100" style={{ width: `${30 + (i * 17) % 25}%` }} />
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 font-body text-xs text-gray-400">
        Song details revealed on drop day
      </p>

      {/* Logged in — just a note */}
      {isLoggedIn && (
        <p className="mt-6 font-body text-xs text-gray-400">
          You&apos;ll get notified when this drops
        </p>
      )}
    </div>
  );
}
