"use client";

import { DotsSixVertical, X, Fire, MusicNote } from "@phosphor-icons/react";
import { api } from "@/trpc/react";

interface Song {
  id: string;
  title: string;
  artist: string;
  album: string | null;
  albumArtUrl: string | null;
  position: number;
  earlyDrop: boolean;
}

export function SongList({
  queueId,
  songs,
  editable,
}: {
  queueId: string;
  songs: Song[];
  editable: boolean;
}) {
  const utils = api.useUtils();

  const removeSong = api.queue.removeSong.useMutation({
    onSuccess: () => void utils.queue.getById.invalidate({ queueId }),
  });

  const toggleEarlyDrop = api.queue.toggleEarlyDrop.useMutation({
    onSuccess: () => void utils.queue.getById.invalidate({ queueId }),
  });

  if (songs.length === 0) {
    return (
      <div className="rounded-[var(--radius-xl)] border-3 border-dashed border-gray-200 px-6 py-10 text-center">
        <p className="font-display text-sm font-bold uppercase tracking-wide text-gray-400">
          No songs yet
        </p>
        <p className="mt-1 font-body text-xs text-gray-400">
          Paste a Spotify or Apple Music link above to add songs.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[var(--radius-xl)] border-3 border-black">
      {songs.map((song, i) => (
        <div
          key={song.id}
          className="group relative flex items-center gap-3.5 px-4 py-4 transition-colors hover:bg-gray-50 sm:gap-4 sm:px-[18px]"
          style={{
            borderTop: i > 0 ? "1px solid var(--color-gray-200)" : undefined,
            animation: `slide-from-left 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${0.5 + i * 0.1}s both`,
          }}
        >
          {/* Position circle */}
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-pink font-display text-xs font-bold text-white">
            {i + 1}
          </div>

          {/* Album art */}
          {song.albumArtUrl ? (
            <img
              src={song.albumArtUrl}
              alt={song.album ?? song.title}
              className="h-12 w-12 shrink-0 rounded-[14px] border-3 border-black object-cover max-sm:h-[42px] max-sm:w-[42px]"
            />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] border-3 border-black bg-gray-100 max-sm:h-[42px] max-sm:w-[42px]">
              <MusicNote weight="fill" size={20} className="opacity-40" />
            </div>
          )}

          {/* Song info */}
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-[0.92rem] font-bold leading-tight">
              {song.title}
            </p>
            <p className="truncate font-body text-[0.8rem] font-medium text-gray-500">
              {song.artist}
            </p>
          </div>

          {/* Early drop badge (view mode) */}
          {song.earlyDrop && !editable && (
            <span className="shrink-0 rounded-lg bg-pink/10 px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-widest text-pink">
              Early
            </span>
          )}

          {/* Flame toggle */}
          {editable && (
            <button
              type="button"
              onClick={() => toggleEarlyDrop.mutate({ songId: song.id })}
              disabled={toggleEarlyDrop.isPending}
              className={`flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border-none bg-transparent transition-all ${
                song.earlyDrop
                  ? "animate-[flame-pop_0.3s_ease] opacity-100"
                  : "opacity-30 hover:opacity-60"
              }`}
              title={song.earlyDrop ? "Disable early drop" : "Enable early drop"}
            >
              <Fire weight="fill" size={16} className={song.earlyDrop ? "text-pink" : "text-gray-500"} />
            </button>
          )}

          {/* Drag handle */}
          {editable && (
            <div className="flex shrink-0 cursor-grab items-center p-1 opacity-20 transition-opacity group-hover:opacity-50">
              <DotsSixVertical weight="bold" size={16} />
            </div>
          )}

          {/* Remove button (hover) */}
          {editable && (
            <button
              type="button"
              onClick={() => removeSong.mutate({ songId: song.id })}
              disabled={removeSong.isPending}
              className="absolute top-2 right-2 flex h-[22px] w-[22px] cursor-pointer items-center justify-center rounded-full border-none bg-gray-100 text-gray-500 opacity-0 transition-all hover:bg-pink hover:text-white group-hover:opacity-100"
              title="Remove song"
            >
              <X weight="bold" size={12} />
            </button>
          )}
        </div>
      ))}

      {/* Keep adding prompt */}
      {editable && (
        <div className="border-t border-gray-200 px-4 py-5 text-center font-body text-[0.82rem] font-medium text-gray-300">
          Keep adding songs until Friday
        </div>
      )}
    </div>
  );
}
