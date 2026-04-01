"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CaretLeft, LinkSimple, Copy, Check, PaperPlaneTilt, ShareNetwork, Sparkle } from "@phosphor-icons/react";
import { api } from "@/trpc/react";
import { Badge } from "@/components/ui/badge";
import { WeekStrip } from "@/components/ui/week-strip";
import { Card } from "@/components/ui/card";
import { SongInput } from "./song-input";
import { SongList } from "./song-list";
import { RecipientPicker } from "./recipient-picker";

export function QueueEditor({
  queueId,
  userId,
}: {
  queueId: string;
  userId: string;
}) {
  const router = useRouter();
  const [queue] = api.queue.getById.useSuspenseQuery({ queueId });
  const utils = api.useUtils();

  const isCreator = queue.creatorId === userId;
  const isDraft = queue.status === "draft";

  const publish = api.queue.publish.useMutation({
    onSuccess: () => {
      void utils.queue.getById.invalidate({ queueId });
      router.push("/dashboard");
    },
  });

  if (!isCreator) {
    return (
      <div className="min-h-screen bg-white">
        <nav className="sticky top-0 z-50 flex items-center justify-between border-b-3 border-black bg-white px-6 py-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 font-body text-sm font-semibold text-black transition-colors hover:text-pink"
          >
            <CaretLeft weight="bold" size={18} />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
          <span className="absolute left-1/2 -translate-x-1/2 font-display text-xl font-black tracking-tight">
            krun<span className="text-pink">k</span>
          </span>
        </nav>
        <main className="mx-auto max-w-[620px] px-6 py-10">
          <p className="font-body text-gray-600">
            You can only view this queue, not edit it.
          </p>
        </main>
      </div>
    );
  }

  const weekDate = new Date(queue.weekStartDate + "T00:00:00").toLocaleDateString(
    "en-US",
    { month: "long", day: "numeric" },
  );

  return (
    <div className="dot-grid min-h-screen bg-white pb-10">
      {/* Top bar */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b-3 border-black bg-white px-6 py-4">
        <Link
          href="/dashboard"
          className="flex min-w-[120px] items-center gap-1.5 font-body text-sm font-semibold text-black transition-colors hover:text-pink"
        >
          <CaretLeft weight="bold" size={18} />
          <span className="hidden sm:inline">Dashboard</span>
        </Link>

        <span className="absolute left-1/2 -translate-x-1/2 font-display text-xl font-black tracking-tight">
          krun<span className="text-pink">k</span>
        </span>

        <Badge variant="pink" className="min-w-[80px] text-right">
          {queue.songs.length} {queue.songs.length === 1 ? "song" : "songs"}
        </Badge>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-[620px] px-6 pt-8">
        {/* Week strip + countdown */}
        <section className="mb-8 animate-[fade-up_0.5s_ease-out_0.05s_both]">
          <WeekStrip
            dropDay="friday"
            onDropEarly={
              isDraft
                ? () => publish.mutate({ queueId })
                : undefined
            }
          />
        </section>

        {/* Queue header */}
        <section className="mb-7 animate-[fade-up_0.5s_ease-out_0.15s_both]">
          <h1 className="font-display text-[clamp(1.8rem,5vw,2.4rem)] font-black leading-tight tracking-tight">
            This week&apos;s queue
          </h1>
          <div className="mt-1 flex items-center gap-3">
            <span className="font-body text-[0.95rem] font-medium text-gray-500">
              Week of {weekDate}
            </span>
            {isDraft && <Badge variant="outline">Draft</Badge>}
          </div>
          {!isDraft && (
            <p className="mt-2 font-body text-sm text-gray-600">
              This queue is published. Editing is disabled.
            </p>
          )}
        </section>

        {/* Share link — THE primary way to send this queue */}
        <ShareLink queueId={queueId} />

        {/* Drop zone / song input */}
        {isDraft && (
          <section className="mb-8 animate-[fade-up_0.5s_ease-out_0.3s_both]">
            <SongInput queueId={queueId} />
          </section>
        )}

        {/* Song list */}
        <section className="mb-9 animate-[fade-up_0.5s_ease-out_0.4s_both]">
          <SongList
            queueId={queueId}
            songs={queue.songs}
            editable={isDraft}
          />
        </section>

        {/* Recipients */}
        <section className="mb-8 animate-[fade-up_0.5s_ease-out_0.55s_both]">
          <h2 className="mb-4 font-display text-lg font-black">
            Sending to{" "}
            <span className="text-gray-400">({queue.recipients.length})</span>
          </h2>
          <RecipientPicker
            queueId={queueId}
            recipients={queue.recipients}
            editable={isDraft}
          />
        </section>

        {/* AI preview */}
        <AiPreview
          queueId={queueId}
          songCount={queue.songs.length}
          initialAiName={queue.aiName}
          initialCoverUrl={queue.aiCoverUrl}
        />

        {/* Drop early link (replaces publish button) */}
        {isDraft && !publish.isPending && (
          <div className="pb-6 text-center">
            <button
              type="button"
              onClick={() => publish.mutate({ queueId })}
              disabled={publish.isPending || queue.songs.length === 0}
              className="font-body text-xs font-medium text-gray-300 underline underline-offset-2 transition-colors hover:text-pink disabled:cursor-not-allowed disabled:opacity-50"
            >
              Drop early
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Share Link — the primary way to send a queue                       */
/* ------------------------------------------------------------------ */

function ShareLink({ queueId }: { queueId: string }) {
  const [copied, setCopied] = useState(false);

  const queueUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/queue/${queueId}`
      : `/queue/${queueId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(queueUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = queueUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Check out my queue on Krunk",
          text: "I made you a playlist 🔊",
          url: queueUrl,
        });
      } catch {
        // User cancelled or not supported
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  return (
    <section className="mb-8 animate-[fade-up_0.5s_ease-out_0.2s_both]">
      <h2 className="mb-3 font-display text-lg font-black">Share this queue</h2>
      <div className="flex items-stretch gap-2">
        {/* Link display + copy */}
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-[var(--radius-lg)] border-3 border-black bg-gray-50 px-4 py-3">
          <LinkSimple weight="bold" size={16} className="shrink-0 text-gray-400" />
          <span className="truncate font-body text-sm text-gray-500">
            {queueUrl.replace(/^https?:\/\//, "")}
          </span>
        </div>

        {/* Copy button */}
        <button
          type="button"
          onClick={handleCopy}
          className="shrink-0 rounded-[var(--radius-lg)] border-3 border-black bg-white px-4 py-3 font-display text-sm font-bold transition-all active:scale-[0.97] hover:bg-gray-50"
        >
          {copied ? <><Check weight="bold" size={18} className="inline -mt-0.5" /> Copied!</> : <><Copy weight="bold" size={18} className="inline -mt-0.5" /> Copy</>}
        </button>

        {/* Share button (uses native share on mobile) */}
        <button
          type="button"
          onClick={handleShare}
          className="shrink-0 rounded-[var(--radius-lg)] bg-pink px-5 py-3 font-display text-sm font-bold text-white transition-all active:scale-[0.97]"
        >
          <span className="hidden sm:inline"><PaperPlaneTilt weight="fill" size={18} className="inline -mt-0.5 mr-1.5" />Send to friend</span>
          <ShareNetwork weight="bold" size={20} className="sm:hidden" />
        </button>
      </div>
      <p className="mt-2 font-body text-xs text-gray-400">
        Anyone with this link can view your queue and sign up to listen
      </p>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* AI Preview — generate name + cover, with ONE reroll                 */
/* ------------------------------------------------------------------ */

const DICE_MESSAGES = [
  "Could be fire. Could be cursed.",
  "Feeling lucky?",
  "No takebacks after this one.",
  "The AI gods decide your fate.",
  "Roll the dice on your cover art.",
  "Better or worse — who knows.",
] as const;

type BlurStyle = "squiggle" | "mosaic" | "swirl" | "none";

const BLUR_STYLES: { id: BlurStyle; label: string; filter: string }[] = [
  { id: "squiggle", label: "Squiggle", filter: "url(#squiggle) saturate(1.3)" },
  { id: "mosaic", label: "Mosaic", filter: "url(#mosaic) contrast(1.1)" },
  { id: "swirl", label: "Swirl", filter: "url(#swirl) saturate(1.2)" },
  { id: "none", label: "Clear", filter: "none" },
];

function AiPreview({
  queueId,
  songCount,
  initialAiName,
  initialCoverUrl,
}: {
  queueId: string;
  songCount: number;
  initialAiName?: string | null;
  initialCoverUrl?: string | null;
}) {
  const [preview, setPreview] = useState<{
    aiName: string;
    coverImageUrl?: string;
  } | null>(
    initialAiName ? { aiName: initialAiName, coverImageUrl: initialCoverUrl ?? undefined } : null,
  );
  const [loading, setLoading] = useState(false);
  const [hasRerolled, setHasRerolled] = useState(false);
  const [showRerollConfirm, setShowRerollConfirm] = useState(false);
  const [rerollMessage] = useState(
    () => DICE_MESSAGES[Math.floor(Math.random() * DICE_MESSAGES.length)],
  );
  const [blurStyle, setBlurStyle] = useState<BlurStyle>("squiggle");
  const [flipAnim, setFlipAnim] = useState(false);

  const previewAI = api.queue.previewAI.useMutation({
    onMutate: () => setLoading(true),
    onSuccess: (data) => {
      setPreview(data);
      setLoading(false);
      setFlipAnim(true);
      setTimeout(() => setFlipAnim(false), 600);
    },
    onError: () => setLoading(false),
  });

  const handleGenerate = useCallback(() => {
    if (songCount === 0) return;
    previewAI.mutate({ queueId });
  }, [previewAI, queueId, songCount]);

  const handleReroll = useCallback(() => {
    setShowRerollConfirm(false);
    setHasRerolled(true);
    previewAI.mutate({ queueId });
  }, [previewAI, queueId]);

  const currentFilter =
    BLUR_STYLES.find((s) => s.id === blurStyle)?.filter ?? "none";

  return (
    <section className="mb-9 animate-[fade-up_0.5s_ease-out_0.65s_both]">
      {/* SVG filters */}
      <svg className="absolute h-0 w-0" aria-hidden>
        <defs>
          <filter id="squiggle">
            <feTurbulence baseFrequency="0.015" numOctaves="3" seed="2" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="18" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id="mosaic">
            <feMorphology in="SourceGraphic" operator="dilate" radius="3" result="d" />
            <feGaussianBlur in="d" stdDeviation="2.5" />
          </filter>
          <filter id="swirl">
            <feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves="2" seed="5" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="30" xChannelSelector="R" yChannelSelector="B" />
            <feGaussianBlur stdDeviation="1" />
          </filter>
        </defs>
      </svg>

      <Card className="rotate-[-0.6deg] overflow-visible">
        {/* Not generated yet */}
        {!preview && !loading && (
          <div className="flex items-center gap-4 max-sm:flex-col max-sm:text-center">
            <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-[14px] border-3 border-black bg-gray-50 max-sm:mx-auto">
              <Sparkle weight="duotone" size={28} className="text-gray-300" />
            </div>
            <div className="flex-1">
              <p className="font-body text-sm font-medium text-gray-500 leading-relaxed">
                {songCount > 0
                  ? "See what AI comes up with for your cover & name"
                  : "Add songs first to preview AI art"}
              </p>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={songCount === 0}
                className="mt-2 inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-black px-4 py-2.5 font-display text-xs font-bold text-white transition-all active:scale-[0.97] disabled:opacity-30"
              >
                <Sparkle weight="fill" size={14} />
                Generate preview
              </button>
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex items-center gap-4 max-sm:flex-col max-sm:text-center">
            <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-[14px] border-3 border-black bg-gray-50 max-sm:mx-auto">
              <div className="h-6 w-6 animate-spin rounded-full border-3 border-gray-200 border-t-pink" />
            </div>
            <div className="flex-1">
              <p className="font-display text-sm font-bold">
                {hasRerolled ? "Rerolling..." : "Generating..."}
              </p>
              <p className="mt-0.5 font-body text-xs text-gray-400">
                Analyzing album art & creating cover (~30s)
              </p>
            </div>
          </div>
        )}

        {/* Preview result */}
        {preview && !loading && (
          <div>
            <div className="flex items-start gap-4 max-sm:flex-col max-sm:items-center max-sm:text-center">
              {/* Cover art with filter */}
              <div
                className={`relative h-[100px] w-[100px] shrink-0 overflow-hidden rounded-[16px] border-3 border-black max-sm:mx-auto ${flipAnim ? "animate-[flip_0.6s_ease-out]" : ""}`}
              >
                {preview.coverImageUrl ? (
                  <img
                    src={preview.coverImageUrl}
                    alt="AI preview"
                    className="h-full w-full object-cover transition-[filter] duration-500"
                    style={{ filter: currentFilter }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-100">
                    <Sparkle weight="duotone" size={32} className="text-gray-300" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <p className="font-display text-lg font-black leading-tight">
                  &ldquo;{preview.aiName}&rdquo;
                </p>
                <p className="mt-1 font-body text-xs text-gray-500">
                  AI-generated &middot; full reveal on drop day
                </p>

                {/* Blur style pills */}
                {preview.coverImageUrl && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {BLUR_STYLES.map((style) => (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => setBlurStyle(style.id)}
                        className={`rounded-full px-3 py-1 font-display text-[10px] font-bold transition-all ${
                          blurStyle === style.id
                            ? "bg-pink text-white"
                            : "border-2 border-gray-200 bg-white text-gray-500 hover:border-pink hover:text-pink"
                        }`}
                      >
                        {style.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Reroll section */}
                {!hasRerolled && !showRerollConfirm && (
                  <button
                    type="button"
                    onClick={() => setShowRerollConfirm(true)}
                    className="mt-3 inline-flex items-center gap-1.5 font-display text-[11px] font-bold text-gray-400 transition-colors hover:text-pink"
                  >
                    🎲 Reroll
                  </button>
                )}

                {hasRerolled && (
                  <p className="mt-3 font-body text-[11px] text-gray-400">
                    ✓ No more rerolls — this is your destiny
                  </p>
                )}
              </div>
            </div>

            {/* Reroll confirmation overlay */}
            {showRerollConfirm && (
              <div className="mt-4 rounded-[var(--radius-lg)] border-3 border-dashed border-pink bg-pink/5 p-4 text-center">
                <p className="font-display text-sm font-black">
                  🎲 {rerollMessage}
                </p>
                <p className="mt-1 font-body text-xs text-gray-500">
                  You get ONE reroll. New name, new art. No going back.
                </p>
                <div className="mt-3 flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={handleReroll}
                    className="rounded-[var(--radius-md)] bg-pink px-5 py-2.5 font-display text-xs font-bold text-white transition-all active:scale-[0.97]"
                  >
                    🎲 Roll it
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRerollConfirm(false)}
                    className="rounded-[var(--radius-md)] border-3 border-black bg-white px-5 py-2.5 font-display text-xs font-bold transition-all active:scale-[0.97]"
                  >
                    Keep this one
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Flip animation keyframe */}
      <style>{`
        @keyframes flip {
          0% { transform: perspective(400px) rotateY(90deg); opacity: 0; }
          40% { transform: perspective(400px) rotateY(-10deg); }
          70% { transform: perspective(400px) rotateY(5deg); }
          100% { transform: perspective(400px) rotateY(0deg); opacity: 1; }
        }
      `}</style>
    </section>
  );
}
