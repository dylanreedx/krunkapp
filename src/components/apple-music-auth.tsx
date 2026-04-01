"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    MusicKit: {
      configure: (config: {
        developerToken: string;
        app: { name: string; build: string };
      }) => Promise<void>;
      getInstance: () => {
        authorize: () => Promise<string>;
        isAuthorized: boolean;
        musicUserToken: string;
      };
    };
  }
}

export function AppleMusicAuth({
  callbackURL,
}: {
  callbackURL: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const musicKitReady = useRef(false);
  const developerTokenRef = useRef<string | null>(null);

  // Fetch developer token and load MusicKit JS on mount
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        // Fetch developer token
        const res = await fetch("/api/apple-music/token");
        if (!res.ok) throw new Error("Failed to fetch developer token");
        const data = (await res.json()) as { developerToken: string };
        if (cancelled) return;
        developerTokenRef.current = data.developerToken;

        // Load MusicKit JS if not already loaded
        if (!window.MusicKit) {
          await loadMusicKitScript();
        }

        // Configure MusicKit
        await window.MusicKit.configure({
          developerToken: data.developerToken,
          app: { name: "Krunk", build: "1.0.0" },
        });

        musicKitReady.current = true;
      } catch (err) {
        if (!cancelled) {
          console.error("MusicKit init error:", err);
          setError("Failed to initialize Apple Music");
        }
      }
    }

    void init();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAuth = useCallback(async () => {
    if (!musicKitReady.current) {
      setError("Apple Music is still loading...");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // This opens Apple's auth popup
      const musicUserToken =
        await window.MusicKit.getInstance().authorize();

      // Send the token to our server
      const res = await fetch("/api/apple-music/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ musicUserToken }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Authentication failed");
      }

      const data = (await res.json()) as { redirect?: string };
      router.push(data.redirect ?? callbackURL);
    } catch (err) {
      console.error("Apple Music auth error:", err);
      setError(
        err instanceof Error ? err.message : "Authentication failed",
      );
    } finally {
      setLoading(false);
    }
  }, [callbackURL, router]);

  return (
    <div>
      <button
        onClick={handleAuth}
        disabled={loading}
        className="inline-flex cursor-pointer items-center justify-center gap-3 rounded-[16px] border-none bg-black px-8 py-[18px] font-display text-[0.95rem] font-bold text-white transition-transform hover:-translate-y-0.5 hover:shadow-[0_6px_24px_rgba(0,0,0,0.25)] active:translate-y-0 disabled:cursor-wait disabled:opacity-70 max-sm:w-full"
      >
        <svg
          className="h-[22px] w-[22px] shrink-0"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043A5.022 5.022 0 0019.7.197C18.553.058 17.4 0 16.249 0H7.732a24.6 24.6 0 00-2.554.126C4.145.27 3.24.58 2.468 1.192 1.477 1.978.867 3 .613 4.24.5 4.82.438 5.412.39 6.003c-.088 1.093-.1 2.188-.098 3.282v5.43c.005.596.018 1.193.068 1.787.064.788.186 1.567.48 2.308.434 1.092 1.163 1.918 2.196 2.472.63.34 1.313.52 2.022.6.93.107 1.866.12 2.8.12h8.17c1.06 0 2.118-.013 3.168-.158.646-.09 1.27-.247 1.856-.53 1.27-.61 2.098-1.576 2.51-2.907.227-.73.305-1.482.355-2.237.068-1.023.07-2.047.07-3.07V9.26c0-.87-.008-1.74-.068-2.608zm-8.567 6.043l-4.22 2.787c-.26.172-.52.283-.84.2a.741.741 0 01-.565-.717 96.32 96.32 0 010-5.569.742.742 0 01.564-.716c.321-.083.58.028.84.2l4.22 2.786c.252.167.452.38.452.716 0 .336-.2.549-.451.716v-.403z" />
        </svg>
        {loading ? "Connecting..." : "Connect Apple Music"}
      </button>
      {error && (
        <p className="mt-2 font-body text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}

function loadMusicKitScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (document.querySelector('script[src*="musickit"]')) {
      // Wait for it to be ready
      const check = setInterval(() => {
        if (window.MusicKit) {
          clearInterval(check);
          resolve();
        }
      }, 100);
      return;
    }

    const script = document.createElement("script");
    script.src =
      "https://js-cdn.music.apple.com/musickit/v3/musickit.js";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onload = () => {
      // MusicKit JS fires a musickitloaded event when ready
      if (window.MusicKit) {
        resolve();
      } else {
        document.addEventListener(
          "musickitloaded",
          () => resolve(),
          { once: true },
        );
      }
    };
    script.onerror = () => reject(new Error("Failed to load MusicKit JS"));
    document.head.appendChild(script);
  });
}
