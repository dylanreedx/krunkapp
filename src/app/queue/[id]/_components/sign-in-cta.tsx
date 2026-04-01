"use client";

import { Avatar } from "@/components/ui/avatar";
import { authClient } from "@/server/better-auth/client";
import { AppleMusicAuth } from "@/components/apple-music-auth";

type SignInCtaProps = {
  senderName: string;
  senderAvatarId: string;
};

function SpotifyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="#1DB954">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}

export function SignInCta({ senderName, senderAvatarId }: SignInCtaProps) {
  const callbackURL =
    typeof window !== "undefined" ? window.location.href : "/";

  return (
    <div className="mt-7 rounded-[var(--radius-lg)] border-3 border-black border-l-[5px] border-l-pink p-6">
      {/* Header with avatar */}
      <div className="mb-4 flex items-center gap-3">
        <Avatar avatarId={senderAvatarId} size="sm" />
        <h3 className="font-display text-[0.95rem] font-black leading-tight">
          {senderName} wants you to hear this
        </h3>
      </div>

      {/* Description */}
      <p className="mb-[18px] font-body text-[0.84rem] leading-relaxed text-gray-500">
        Sign in with Spotify or Apple Music to start listening instantly.
      </p>

      {/* Auth buttons */}
      <div className="flex flex-wrap gap-2.5">
        <button
          type="button"
          onClick={() =>
            authClient.signIn.social({
              provider: "spotify",
              callbackURL,
            })
          }
          className="inline-flex cursor-pointer items-center gap-2 rounded-[14px] border-3 border-black bg-white px-5 py-3 font-body text-[0.78rem] font-semibold text-black transition-all hover:-translate-y-0.5 hover:bg-gray-50 active:translate-y-0"
        >
          <SpotifyIcon className="h-[18px] w-[18px] shrink-0" />
          Continue with Spotify
        </button>

        <AppleMusicAuth callbackURL={callbackURL} />
      </div>
    </div>
  );
}
