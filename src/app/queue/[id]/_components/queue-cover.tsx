"use client";

import Image from "next/image";
import { Avatar } from "@/components/ui/avatar";

type QueueCoverProps = {
  aiName: string | null;
  aiCoverUrl: string | null;
  senderName: string;
  senderAvatarId: string;
  songCount: number;
  weekDate: string;
};

export function QueueCover({
  aiName,
  aiCoverUrl,
  senderName,
  senderAvatarId,
  songCount,
  weekDate,
}: QueueCoverProps) {
  return (
    <div className="flex flex-col items-center text-center">
      {/* Sender strip — personal touch */}
      <div className="flex items-center gap-3 pb-4 pt-2">
        <Avatar avatarId={senderAvatarId} size="md" />
        <p className="font-body text-[0.92rem] font-medium text-gray-500">
          <strong className="font-bold text-black">{senderName}</strong> picked
          these for you
        </p>
      </div>

      {/* Cover art with slight rotation + sticker badge */}
      <div className="relative w-full max-w-[340px] rotate-[1deg]">
        <div className="relative aspect-square w-full overflow-hidden rounded-[24px] border-3 border-black">
          {aiCoverUrl ? (
            <Image
              src={aiCoverUrl}
              alt={aiName ?? "Queue cover"}
              width={680}
              height={680}
              className="h-full w-full object-cover"
              priority
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1a1a2e] via-[#0f3460] to-[#111]">
              <span className="font-display text-5xl font-black text-white/20">
                K
              </span>
            </div>
          )}

          {/* Title overlay at bottom of cover */}
          <div className="absolute inset-x-0 bottom-0 z-[2] rounded-b-[21px] bg-gradient-to-t from-black/75 via-black/30 to-transparent px-6 pb-6 pt-[60px]">
            <h1 className="font-display text-[1.6rem] font-black leading-[1.15] tracking-tight text-white md:text-[1.8rem]">
              {aiName ?? "Untitled Queue"}
            </h1>
          </div>
        </div>

        {/* Track count sticker badge */}
        <div className="absolute -right-1.5 top-4 z-[3] -rotate-[8deg] rounded-full border-3 border-black bg-pink px-3.5 py-1.5 font-display text-[0.68rem] font-bold tracking-wide text-white">
          {songCount} track{songCount !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Meta line */}
      <p className="mt-4 font-body text-[0.88rem] font-medium tracking-tight text-gray-500">
        Week of {weekDate}
      </p>
    </div>
  );
}
