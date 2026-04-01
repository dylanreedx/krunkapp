"use client";

import { ViewModeProvider, ViewToggle } from "./view-toggle";
import { SongCardView } from "./song-card";
import { SongListView } from "./song-list-view";
import { MagicShuffleView } from "./magic-shuffle-view";
import { CopyLinkButton } from "./copy-link-button";
import { ReactionRow } from "@/components/ui/reaction-row";
import { BookmarkSimple } from "@phosphor-icons/react";

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

type QueueContentProps = {
  queueId: string;
  songs: Song[];
  isLoggedIn: boolean;
  senderName: string;
  senderAvatarId: string;
  platform?: "spotify" | "apple_music";
};

function SpotifyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}

export function QueueContent({
  queueId,
  songs,
  isLoggedIn,
  senderName,
  senderAvatarId,
  platform,
}: QueueContentProps) {
  return (
    <ViewModeProvider>
      {/* Primary CTA -- Listen on Spotify */}
      <div className="mx-auto mt-6 w-full max-w-[480px]">
        <a
          href="#"
          className="flex w-full items-center justify-center gap-3 rounded-full bg-pink px-7 py-[18px] font-display text-base font-bold text-white transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(255,45,120,0.35)] active:translate-y-0"
        >
          <SpotifyIcon className="h-[22px] w-[22px] shrink-0" />
          Listen on Spotify
        </a>
      </div>

      {/* Secondary CTA row */}
      <div className="mx-auto mt-3 flex w-full max-w-[480px] gap-2.5">
        <CopyLinkButton />
        <button
          type="button"
          className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full border-3 border-black bg-white px-6 py-3 font-display text-[0.78rem] font-bold text-black transition-all hover:-translate-y-0.5 hover:bg-gray-50 active:translate-y-0"
        >
          <BookmarkSimple weight="bold" size={18} className="shrink-0" />
          Save
        </button>
      </div>

      {/* View toggle */}
      <div className="mt-7">
        <ViewToggle />
      </div>

      {/* Song views */}
      <div className="mt-5">
        <SongListView
          songs={songs}
          isLoggedIn={isLoggedIn}
          platform={platform}
        />
        <SongCardView
          songs={songs}
          isLoggedIn={isLoggedIn}
          platform={platform}
        />
        <MagicShuffleView
          queueId={queueId}
          songs={songs}
          isLoggedIn={isLoggedIn}
          platform={platform}
        />
      </div>

      {/* Reactions */}
      <ReactionRow className="mt-6" />
    </ViewModeProvider>
  );
}
