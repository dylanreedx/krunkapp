"use client";

import Image from "next/image";
import { getPlatformLink } from "@/lib/deeplinks";
import { useViewMode } from "./view-toggle";
import { cn } from "@/lib/utils";
import { Fire } from "@phosphor-icons/react";

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

type SongCardViewProps = {
  songs: Song[];
  isLoggedIn: boolean;
  platform?: "spotify" | "apple_music";
};

export function SongCardView({
  songs,
  isLoggedIn,
  platform,
}: SongCardViewProps) {
  const { mode } = useViewMode();

  if (mode !== "card") return null;

  return (
    <div className="grid grid-cols-2 gap-3.5">
      {songs.map((song, i) => (
        <SongCard
          key={song.id}
          song={song}
          index={i + 1}
          isLoggedIn={isLoggedIn}
          platform={platform}
          isOdd={i % 2 === 0}
        />
      ))}
    </div>
  );
}

function SongCard({
  song,
  index,
  isLoggedIn,
  platform,
  isOdd,
}: {
  song: Song;
  index: number;
  isLoggedIn: boolean;
  platform?: "spotify" | "apple_music";
  isOdd: boolean;
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

  return (
    <button
      type="button"
      onClick={handleOpen}
      disabled={!isLoggedIn}
      className={cn(
        "group relative w-full overflow-hidden rounded-[18px] border-3 text-left transition-all duration-250",
        song.earlyDrop ? "border-pink" : "border-black",
        isOdd ? "rotate-[1deg]" : "-rotate-[1deg]",
        "hover:-translate-y-1 hover:rotate-0 hover:scale-[1.01]",
        "disabled:cursor-default disabled:hover:translate-y-0 disabled:hover:rotate-0 disabled:hover:scale-100",
      )}
      style={{
        transform: undefined, // Let tailwind handle it
      }}
    >
      {/* Art area */}
      <div className="relative aspect-square w-full">
        {song.albumArtUrl ? (
          <Image
            src={song.albumArtUrl}
            alt={`${song.title} by ${song.artist}`}
            width={400}
            height={400}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-800 to-gray-600">
            <span className="font-display text-2xl font-bold text-white/30">
              {song.title.charAt(0)}
            </span>
          </div>
        )}

        {/* Position number */}
        <div className="absolute left-2.5 top-2.5 flex h-[26px] w-[26px] items-center justify-center rounded-full border-2 border-white bg-pink font-display text-[0.65rem] font-bold text-white">
          {index}
        </div>

        {/* Early drop badge */}
        {song.earlyDrop && (
          <div className="absolute right-2 top-2.5 -rotate-[6deg] rounded-full border-2 border-white bg-pink px-2 py-0.5 font-display text-[0.52rem] font-bold text-white">
            <Fire weight="fill" size={12} className="inline text-white" /> Early
          </div>
        )}

        {/* Title overlay */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent p-3.5">
          <p className="truncate font-display text-[0.82rem] font-bold leading-tight text-white">
            {song.title}
          </p>
          <p className="truncate font-body text-[0.72rem] font-medium text-white/70">
            {song.artist}
          </p>
        </div>
      </div>
    </button>
  );
}
