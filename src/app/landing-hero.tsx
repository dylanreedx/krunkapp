"use client";

import { motion } from "motion/react";
import { authClient } from "@/server/better-auth/client";
import { AppleMusicAuth } from "@/components/apple-music-auth";
import { Avatar, AVATARS } from "@/components/ui/avatar";
import { MusicNote, Play, Image as ImageIcon } from "@phosphor-icons/react";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_SONGS = [
  { n: "1", title: "Rushing Back", artist: "Flume ft. Vera Blue", dur: "4:12", pink: true },
  { n: "2", title: "On The Floor", artist: "Perfume Genius", dur: "3:47", pink: false },
  { n: "3", title: "Location Unknown", artist: "HONNE ft. BEKA", dur: "3:31", pink: false },
  { n: "4", title: "Sunset Lover", artist: "Petit Biscuit", dur: "3:58", pink: false },
];

const TEASE_AVATARS = AVATARS.slice(0, 4);

const FEATURES = [
  {
    title: "Cross-platform",
    desc: "Your friend\u2019s on Spotify, you\u2019re on Apple Music. Doesn\u2019t matter. Everyone hears the same queue.",
    visual: "platforms",
  },
  {
    title: "AI Covers",
    desc: "Every queue gets a unique cover generated from the vibe of your tracks. No two weeks look the same.",
    visual: "ai",
  },
  {
    title: "Weekly Drops",
    desc: "Queues reset every week. Drop yours before Sunday midnight. Then listen to what your people picked.",
    visual: "calendar",
  },
] as const;

// ---------------------------------------------------------------------------
// SVG icons
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Feature visuals
// ---------------------------------------------------------------------------

function PlatformVisual() {
  return (
    <div className="flex items-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-[14px] border-[2.5px] border-black bg-white">
        <SpotifyIcon className="h-[22px] w-[22px]" />
      </div>
      <div className="-ml-3.5 flex h-12 w-12 items-center justify-center rounded-[14px] border-[2.5px] border-black bg-black">
        <AppleMusicIcon className="h-[22px] w-[22px] text-white" />
      </div>
    </div>
  );
}

function AICoverVisual() {
  return (
    <div className="relative flex h-[52px] w-[52px] items-center justify-center rounded-xl border-[2.5px] border-black bg-pink">
      <div className="absolute inset-[6px] rounded-md border-2 border-white/50" />
      <ImageIcon size={20} weight="fill" className="relative z-10 text-white" />
    </div>
  );
}

function CalendarVisual() {
  const days = [
    "past", "past", "past", "past", "past", "", "",
    "past", "past", "past", "today", "", "", "",
  ];
  return (
    <div className="grid w-[120px] grid-cols-7 gap-0.5">
      {days.map((type, i) => (
        <div
          key={i}
          className={`h-3.5 w-3.5 rounded ${
            type === "today"
              ? "border-[1.5px] border-black bg-pink"
              : type === "past"
                ? "bg-gray-300"
                : "bg-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function LandingHero({ callbackURL }: { callbackURL: string }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-white dot-grid">
      {/* ----------------------------------------------------------------- */}
      {/* MASSIVE HEADLINE — bleeds off left edge                           */}
      {/* ----------------------------------------------------------------- */}
      <section className="overflow-visible pt-20">
        <motion.span
          initial={{ opacity: 0, x: -120 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="-ml-[3.5vw] block select-none font-display text-[clamp(5rem,22vw,14rem)] font-black uppercase leading-[0.85] tracking-[-0.04em]"
        >
          krun<span className="text-pink">k</span>
        </motion.span>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.45 }}
          className="ml-[60px] mt-6 max-w-[520px] font-display text-[clamp(1.3rem,3vw,2.6rem)] font-bold leading-[1.2] max-md:ml-5 max-md:text-[clamp(1.1rem,5vw,1.6rem)]"
        >
          Your friends&rsquo; ears.{" "}
          <span className="text-pink">Your taste.</span>
        </motion.h2>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* CONTENT AREA — asymmetric two-column                              */}
      {/* ----------------------------------------------------------------- */}
      <section className="grid grid-cols-1 items-start gap-[50px] px-5 pb-20 pt-[60px] md:grid-cols-[1.15fr_0.85fr] md:gap-[30px] md:px-10 md:pb-20 lg:pl-[60px] lg:pr-10">
        {/* Left column */}
        <div className="pt-5 md:pt-0">
          {/* Pink accent bar */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.55 }}
            className="mb-6 h-1.5 w-20 rounded-sm bg-pink"
          />

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.6 }}
            className="mb-9 max-w-[500px] font-body text-[clamp(1rem,1.3vw,1.2rem)] leading-[1.75] text-black"
          >
            Every week, you and your friends drop a queue &mdash;{" "}
            <strong className="font-bold">5 songs that define your week</strong>.
            Listen across Spotify and Apple Music. See what your people are feeling.
            No algorithms. No feeds. Just music from people you actually know.
          </motion.p>

          {/* Auth buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.75 }}
            className="mb-7 flex flex-col gap-4 sm:flex-row sm:flex-wrap"
          >
            <button
              onClick={() =>
                authClient.signIn.social({
                  provider: "spotify",
                  callbackURL,
                })
              }
              className="inline-flex cursor-pointer items-center justify-center gap-3 rounded-[16px] border-none bg-pink px-8 py-[18px] font-display text-[0.95rem] font-bold text-white transition-transform hover:-translate-y-0.5 hover:shadow-[0_6px_24px_rgba(255,45,120,0.35)] active:translate-y-0 max-sm:w-full"
            >
              <SpotifyIcon className="h-[22px] w-[22px] shrink-0" />
              Connect Spotify
            </button>

            <AppleMusicAuth callbackURL={callbackURL} />
          </motion.div>

          {/* Free line */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.85 }}
            className="mb-8 font-body text-[0.82rem] font-medium text-gray-500"
          >
            Free &middot; No credit card &middot; Takes 10 seconds
          </motion.p>

          {/* Avatar tease */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.95 }}
            className="flex items-center gap-3.5"
          >
            <span className="font-display text-xs font-bold tracking-[0.02em] text-gray-500">
              Choose your look
            </span>
            <div className="flex gap-1.5">
              {TEASE_AVATARS.map((a) => (
                <motion.div
                  key={a.id}
                  whileHover={{ scale: 1.12 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Avatar avatarId={a.id} size="sm" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right column — mock queue card */}
        <div className="flex justify-end max-md:justify-start max-md:pl-2.5 md:-mr-5 md:pt-2.5">
          <motion.div
            initial={{ opacity: 0, x: 80, rotate: 3.5 }}
            animate={{ opacity: 1, x: 0, rotate: 1.8 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.65 }}
            className="relative w-full max-w-sm rounded-[var(--radius-xl)] border-3 border-black bg-white p-7 max-md:max-w-full"
          >
            {/* THIS WEEK badge */}
            <span className="absolute -top-3.5 right-6 rounded-[10px] bg-pink px-3.5 py-1 font-display text-[0.7rem] font-bold tracking-[0.08em] text-white">
              THIS WEEK
            </span>

            {/* Queue header */}
            <div className="mb-5 flex items-start gap-3.5">
              {/* Sender avatar — yellow face */}
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-3 border-black bg-[#FFE14D]">
                <svg viewBox="0 0 40 40" width={28} height={28}>
                  <circle cx={14} cy={16} r={3} fill="#111" />
                  <circle cx={26} cy={16} r={3} fill="#111" />
                  <path
                    d="M15 25 Q20 31 25 25"
                    stroke="#111"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-xl font-black leading-[1.2]">
                  Golden Hour Drive
                </p>
                <p className="font-body text-[0.78rem] font-medium text-gray-500">
                  from Dylan &middot; 4 tracks &middot; dropped 2h ago
                </p>
              </div>
            </div>

            {/* Song list */}
            <div className="flex flex-col gap-1">
              {MOCK_SONGS.map((s, i) => (
                <motion.div
                  key={s.n}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.0 + i * 0.1 }}
                  className="flex items-center gap-3.5 rounded-[14px] px-3.5 py-3 transition-colors hover:bg-gray-50"
                >
                  <span className="w-[22px] shrink-0 text-center font-display text-[0.85rem] font-bold text-gray-500">
                    {s.n}
                  </span>
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border-2 ${
                      s.pink
                        ? "border-pink bg-pink"
                        : "border-black bg-gray-50"
                    }`}
                  >
                    {s.pink ? (
                      <Play weight="fill" size={18} className="text-white" />
                    ) : (
                      <MusicNote weight="fill" size={16} className="text-black" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-body text-[0.9rem] font-semibold">
                      {s.title}
                    </p>
                    <p className="truncate font-body text-[0.78rem] font-medium text-gray-500">
                      {s.artist}
                    </p>
                  </div>
                  <span className="shrink-0 font-body text-[0.78rem] text-gray-500">
                    {s.dur}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* FEATURES                                                          */}
      {/* ----------------------------------------------------------------- */}
      <section className="px-5 pb-24 md:px-10 lg:px-[60px]">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.85 }}
          className="mb-7 font-display text-[0.7rem] font-bold uppercase tracking-[0.12em] text-gray-500"
        >
          How it works
        </motion.p>

        <div className="grid max-w-[960px] grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 40, rotate: i === 1 ? 0 : 0 }}
              animate={{
                opacity: 1,
                y: 0,
                rotate: i === 1 ? -1.5 : 0,
              }}
              transition={{
                duration: 0.7,
                ease: [0.16, 1, 0.3, 1],
                delay: 1.0 + i * 0.15,
              }}
              className="overflow-hidden rounded-[var(--radius-lg)] border-3 border-black px-6 py-7"
            >
              <div className="mb-[18px] flex h-14 items-center">
                {f.visual === "platforms" && <PlatformVisual />}
                {f.visual === "ai" && <AICoverVisual />}
                {f.visual === "calendar" && <CalendarVisual />}
              </div>
              <h3 className="mb-2 font-display text-[1.05rem] font-black">
                {f.title}
              </h3>
              <p className="font-body text-[0.88rem] leading-[1.55] text-gray-600">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* FOOTER                                                            */}
      {/* ----------------------------------------------------------------- */}
      <footer className="flex flex-wrap items-center justify-between gap-4 border-t-3 border-black px-5 py-10 max-md:flex-col max-md:items-start md:px-10 lg:px-[60px]">
        <span className="font-display text-[1.3rem] font-black">krunk</span>
        <ul className="flex list-none gap-6">
          {["About", "Privacy", "@krunkapp"].map((link) => (
            <li key={link}>
              <a
                href="#"
                className="font-body text-[0.85rem] font-medium text-gray-500 transition-colors hover:text-pink"
              >
                {link}
              </a>
            </li>
          ))}
        </ul>
      </footer>
    </main>
  );
}
