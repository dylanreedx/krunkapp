"use client";

import Image from "next/image";
import { getPlatformLink } from "@/lib/deeplinks";
import { useViewMode } from "./view-toggle";
import { cn } from "@/lib/utils";
import { CaretRight, Fire } from "@phosphor-icons/react";

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

type SongListViewProps = {
  songs: Song[];
  isLoggedIn: boolean;
  platform?: "spotify" | "apple_music";
};

export function SongListView({
  songs,
  isLoggedIn,
  platform,
}: SongListViewProps) {
  const { mode } = useViewMode();

  if (mode !== "list") return null;

  return (
    <div className="overflow-hidden rounded-[var(--radius-xl)] border-3 border-black">
      {songs.map((song, i) => (
        <SongRow
          key={song.id}
          song={song}
          index={i + 1}
          isLoggedIn={isLoggedIn}
          platform={platform}
          isLast={i === songs.length - 1}
        />
      ))}
    </div>
  );
}

function SpotifyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}

function AppleMusicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043A5.022 5.022 0 0019.2.04 10.49 10.49 0 0017.39 0H6.607a10.632 10.632 0 00-1.808.04A5.1 5.1 0 002.42.886C1.303 1.618.557 2.617.24 3.93a9.206 9.206 0 00-.24 2.19V17.87a9.21 9.21 0 00.24 2.19c.317 1.31 1.062 2.31 2.18 3.043.493.326 1.04.55 1.63.67.482.098.974.148 1.468.148h10.87c.495 0 .986-.05 1.469-.148a5.017 5.017 0 001.63-.67c1.117-.732 1.862-1.732 2.18-3.043a9.23 9.23 0 00.24-2.19V6.124zM17.7 16.432c-.4.612-.8 1.225-1.32 1.73-.34.328-.73.588-1.168.73-.68.22-1.3.08-1.89-.22a2.816 2.816 0 00-1.268-.31 2.869 2.869 0 00-1.298.33c-.62.31-1.25.44-1.93.2a3.572 3.572 0 01-1.17-.74c-.98-.98-1.73-2.12-2.27-3.39-.35-.82-.57-1.68-.62-2.58-.06-1.14.19-2.18.82-3.11a3.979 3.979 0 012.06-1.6 3.16 3.16 0 012.12-.08c.42.13.82.31 1.22.49.29.13.59.12.88 0 .47-.2.94-.39 1.44-.5a3.3 3.3 0 012.54.37c.17.11.17.11.06.27-.68.93-.91 1.98-.66 3.12.25 1.1.88 1.93 1.82 2.52.07.05.07.05.04.12-.27.62-.57 1.22-.94 1.79l.02.01zM12.44 4.73c-.83.07-1.59.35-2.23.9-.51.44-.86.98-1.01 1.64-.02.09-.04.09-.12.07a3.243 3.243 0 01-.05-1.16c.16-.94.63-1.68 1.38-2.25a3.74 3.74 0 012.15-.79c.1-.01.1-.01.1.09.03.5-.02 1-.22 1.5z" />
    </svg>
  );
}

export function SongRow({
  song,
  index,
  isLoggedIn,
  platform,
  isLast,
}: {
  song: Song;
  index: number;
  isLoggedIn: boolean;
  platform?: "spotify" | "apple_music";
  isLast: boolean;
}) {
  const handleOpen = () => {
    if (!isLoggedIn || !platform) return;
    const link = getPlatformLink(song, platform);
    if (link) {
      window.open(link.appLink, "_blank");
      setTimeout(() => {
        window.open(link.webLink, "_blank");
      }, 1500);
    }
  };

  const hasPlatformIcon = song.spotifyUri || song.appleMusicId;

  return (
    <button
      type="button"
      onClick={handleOpen}
      disabled={!isLoggedIn}
      className={cn(
        "group flex w-full items-center gap-3 bg-white px-4 py-3.5 text-left transition-all duration-200 hover:translate-x-1 active:translate-x-0 disabled:cursor-default disabled:hover:translate-x-0",
        !isLast && "border-b border-gray-200",
        song.earlyDrop && "bg-[rgba(255,45,120,0.05)] hover:bg-[rgba(255,45,120,0.1)]",
      )}
    >
      {/* Position number in pink circle */}
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-pink font-display text-[0.72rem] font-bold text-white">
        {index}
      </div>

      {/* Album art */}
      <div
        className={cn(
          "h-11 w-11 shrink-0 overflow-hidden rounded-[10px] border-3",
          song.earlyDrop ? "border-pink" : "border-black",
        )}
      >
        {song.albumArtUrl ? (
          <Image
            src={song.albumArtUrl}
            alt={`${song.title} by ${song.artist}`}
            width={44}
            height={44}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-800 to-gray-600">
            <span className="font-display text-xs font-bold text-white">
              {song.title.charAt(0)}
            </span>
          </div>
        )}
      </div>

      {/* Song info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-display text-[0.82rem] font-bold leading-tight">
            {song.title}
          </h3>
          {song.earlyDrop && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-pink px-2 py-0.5 font-display text-[0.58rem] font-bold tracking-wide text-white">
              <Fire weight="fill" size={14} className="text-white" /> Early Drop
            </span>
          )}
        </div>
        <p className="truncate font-body text-[0.78rem] font-medium text-gray-500">
          {song.artist}
        </p>
      </div>

      {/* Platform icon + chevron */}
      <div className="flex shrink-0 items-center gap-2">
        {hasPlatformIcon && (
          <div className="opacity-40 transition-opacity group-hover:opacity-100">
            {song.spotifyUri ? (
              <SpotifyIcon className="h-[22px] w-[22px] text-[#1DB954]" />
            ) : (
              <AppleMusicIcon className="h-[22px] w-[22px] text-pink" />
            )}
          </div>
        )}
        <CaretRight weight="bold" size={14} className="text-gray-300 transition-all group-hover:translate-x-0.5 group-hover:text-gray-500" />
      </div>
    </button>
  );
}
