"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CaretLeft, LinkSimple, Copy, Check, PaperPlaneTilt, ShareNetwork, Sparkle } from "@phosphor-icons/react";
import { HoloCover } from "@/components/ui/holo-cover";
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
            Listeners{" "}
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

// Single blur style — "peek" only

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
    initialAiName
      ? { aiName: initialAiName, coverImageUrl: initialCoverUrl ?? undefined }
      : null,
  );
  const [loading, setLoading] = useState(false);
  const [hasRerolled, setHasRerolled] = useState(false);
  const [showRerollConfirm, setShowRerollConfirm] = useState(false);
  const [flipAnim, setFlipAnim] = useState(false);
  const [shakeAnim, setShakeAnim] = useState(false);

  const previewAI = api.queue.previewAI.useMutation({
    onMutate: () => setLoading(true),
    onSuccess: (data) => {
      setPreview(data);
      setLoading(false);
      setFlipAnim(true);
      setTimeout(() => setFlipAnim(false), 700);
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
    setShakeAnim(true);
    setTimeout(() => {
      setShakeAnim(false);
      previewAI.mutate({ queueId });
    }, 600);
  }, [previewAI, queueId]);

  return (
    <section className="mb-9 animate-[fade-up_0.5s_ease-out_0.65s_both]">
      <Card className="rotate-[-0.6deg] overflow-hidden">
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

        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-4 max-sm:flex-col max-sm:text-center">
            <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-[14px] border-3 border-black bg-gray-50 max-sm:mx-auto">
              <div className="h-6 w-6 animate-spin rounded-full border-3 border-gray-200 border-t-pink" />
            </div>
            <div className="flex-1">
              <p className="font-display text-sm font-bold">
                {hasRerolled ? "Rerolling the dice..." : "Cooking up your cover..."}
              </p>
              <p className="mt-0.5 font-body text-xs text-gray-400">
                Analyzing your songs & generating art (~30s)
              </p>
            </div>
          </div>
        )}

        {/* Result */}
        {preview && !loading && (
          <div>
            <div className="flex items-start gap-4 max-sm:flex-col max-sm:items-center max-sm:text-center">
              {/* Cover art — holographic with blur */}
              <div className={`shrink-0 max-sm:mx-auto ${flipAnim ? "animate-[flip_0.7s_ease-out]" : ""} ${shakeAnim ? "animate-[shake_0.5s_ease-in-out]" : ""}`}>
                {preview.coverImageUrl ? (
                  <HoloCover
                    src={preview.coverImageUrl}
                    size={110}
                    blurred
                    interactive
                  />
                ) : (
                  <div className="flex h-[110px] w-[110px] items-center justify-center rounded-[18px] border-3 border-black bg-gray-100">
                    <Sparkle weight="duotone" size={32} className="text-gray-300" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <p className="font-display text-lg font-black leading-tight">
                  &ldquo;{preview.aiName}&rdquo;
                </p>
                <p className="mt-1 font-body text-xs text-gray-500">
                  Full reveal on drop day
                </p>


                {/* Reroll — dramatic, scarce */}
                {!hasRerolled && !showRerollConfirm && (
                  <button
                    type="button"
                    onClick={() => setShowRerollConfirm(true)}
                    className="mt-4 inline-flex items-center gap-2 rounded-[var(--radius-md)] border-2 border-dashed border-gray-300 px-3.5 py-2 font-display text-[11px] font-bold text-gray-400 transition-all hover:border-pink hover:text-pink"
                  >
                    <Sparkle weight="bold" size={12} />
                    Reroll (1 left)
                  </button>
                )}

                {hasRerolled && (
                  <p className="mt-4 font-display text-[11px] font-bold text-gray-300">
                    No rerolls left
                  </p>
                )}
              </div>
            </div>

            {/* Reroll confirmation — feels consequential */}
            {showRerollConfirm && (
              <div className="mt-5 rounded-[var(--radius-lg)] border-3 border-pink bg-pink/5 p-5">
                <p className="font-display text-base font-black text-black">
                  Are you sure?
                </p>
                <p className="mt-1 font-body text-sm text-gray-600">
                  This will destroy your current cover and name.
                  You&apos;ll get a completely new one. No going back.
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={handleReroll}
                    className="rounded-[var(--radius-md)] bg-pink px-5 py-2.5 font-display text-xs font-bold text-white transition-all active:scale-[0.97]"
                  >
                    Destroy & reroll
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRerollConfirm(false)}
                    className="rounded-[var(--radius-md)] border-3 border-black bg-white px-5 py-2.5 font-display text-xs font-bold transition-all active:scale-[0.97]"
                  >
                    Keep it
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      <style>{`
        @keyframes flip {
          0% { transform: perspective(400px) rotateY(90deg); opacity: 0; }
          40% { transform: perspective(400px) rotateY(-10deg); }
          70% { transform: perspective(400px) rotateY(5deg); }
          100% { transform: perspective(400px) rotateY(0deg); opacity: 1; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0) rotate(-0.6deg); }
          20% { transform: translateX(-8px) rotate(-2deg); }
          40% { transform: translateX(8px) rotate(1.5deg); }
          60% { transform: translateX(-5px) rotate(-1deg); }
          80% { transform: translateX(5px) rotate(0.5deg); }
        }
      `}</style>
    </section>
  );
}
