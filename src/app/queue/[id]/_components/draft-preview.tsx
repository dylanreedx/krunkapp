"use client";

import { Avatar } from "@/components/ui/avatar";
import { WeekStrip } from "@/components/ui/week-strip";
import { SignInCta } from "./sign-in-cta";

export function DraftPreview({
  senderName,
  senderAvatarId,
  aiCoverUrl,
  songCount,
  weekDate,
  isLoggedIn,
}: {
  senderName: string;
  senderAvatarId: string;
  aiCoverUrl: string | null;
  songCount: number;
  weekDate: string;
  isLoggedIn: boolean;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      {/* Sender strip */}
      <div className="flex items-center gap-3 pb-6 pt-2">
        <Avatar avatarId={senderAvatarId} size="md" />
        <p className="font-body text-[0.92rem] font-medium text-gray-500">
          <strong className="font-bold text-black">{senderName}</strong> is
          making you something
        </p>
      </div>

      {/* Blurred cover preview */}
      <div className="relative w-full max-w-[340px] rotate-[1deg]">
        <div className="relative aspect-square w-full overflow-hidden rounded-[24px] border-3 border-black">
          {aiCoverUrl ? (
            <img
              src={aiCoverUrl}
              alt=""
              className="h-full w-full scale-[1.3] object-cover blur-[16px] saturate-[1.6] brightness-[0.75]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1a1a2e] via-[#0f3460] to-[#111]">
              <span className="font-display text-5xl font-black text-white/10">
                ?
              </span>
            </div>
          )}

          {/* Center overlay */}
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

        {/* Track count sticker */}
        <div className="absolute -right-1.5 top-4 z-[3] -rotate-[8deg] rounded-full border-3 border-black bg-pink px-3.5 py-1.5 font-display text-[0.68rem] font-bold tracking-wide text-white">
          {songCount} track{songCount !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Week strip countdown */}
      <div className="mt-8 w-full">
        <WeekStrip dropDay="friday" />
      </div>

      {/* Blurred fake song list — teaser */}
      <div className="mt-8 w-full overflow-hidden rounded-[var(--radius-xl)] border-3 border-black">
        {Array.from({ length: Math.min(songCount, 5) }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 border-b border-gray-100 px-5 py-3.5 last:border-b-0"
          >
            {/* Fake position */}
            <div className="h-6 w-6 rounded-full bg-gray-200" />
            {/* Fake album art */}
            <div className="h-10 w-10 rounded-[10px] bg-gray-200" />
            {/* Fake text lines */}
            <div className="flex-1 space-y-1.5">
              <div
                className="h-3.5 rounded-full bg-gray-200"
                style={{ width: `${50 + Math.random() * 30}%` }}
              />
              <div
                className="h-2.5 rounded-full bg-gray-100"
                style={{ width: `${30 + Math.random() * 25}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 font-body text-xs text-gray-400">
        Song details revealed on drop day
      </p>

      {/* Sign-in CTA if not logged in */}
      {!isLoggedIn && (
        <div className="mt-6 w-full">
          <SignInCta
            senderName={senderName}
            senderAvatarId={senderAvatarId}
          />
        </div>
      )}
    </div>
  );
}
