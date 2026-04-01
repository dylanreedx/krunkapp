"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MusicNote } from "@phosphor-icons/react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";

function isMusicUrl(text: string): boolean {
  return /spotify\.com|music\.apple\.com|spotify:/i.test(text);
}

export function SongInput({ queueId }: { queueId: string }) {
  const [showFallback, setShowFallback] = useState(false);
  const [fallbackUrl, setFallbackUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [flashBorder, setFlashBorder] = useState(false);
  const [toast, setToast] = useState<{ url: string } | null>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const utils = api.useUtils();

  const addSong = api.queue.addSong.useMutation({
    onMutate: () => {
      setIsResolving(true);
      setError(null);
    },
    onSuccess: () => {
      setFallbackUrl("");
      setError(null);
      setIsResolving(false);
      setFlashBorder(false);
      void utils.queue.getById.invalidate({ queueId });
    },
    onError: (err) => {
      setError(err.message);
      setIsResolving(false);
      setFlashBorder(false);
    },
  });

  const handleAdd = useCallback(
    (url: string) => {
      const trimmed = url.trim();
      if (!trimmed) return;

      if (!isMusicUrl(trimmed) && !trimmed.startsWith("http")) {
        setError("Paste a Spotify or Apple Music link.");
        return;
      }

      setFlashBorder(true);
      addSong.mutate({ queueId, url: trimmed });
    },
    [addSong, queueId],
  );

  // Global paste listener
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const text = e.clipboardData?.getData("text") ?? "";
      if (text && (isMusicUrl(text) || text.startsWith("http"))) {
        e.preventDefault();
        handleAdd(text);
      }
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [handleAdd]);

  // Mobile: check clipboard on focus for music URL toast
  useEffect(() => {
    async function onFocus() {
      try {
        if (!navigator.clipboard?.readText) return;
        const text = await navigator.clipboard.readText();
        if (text && isMusicUrl(text)) {
          setToast({ url: text });
          // Auto-dismiss after 6s
          setTimeout(() => setToast(null), 6000);
        }
      } catch {
        // Permission denied or not supported
      }
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  // Drag/drop on the zone
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (dropZoneRef.current) {
      dropZoneRef.current.style.background = "rgba(255, 45, 120, 0.06)";
    }
  };

  const onDragLeave = () => {
    if (dropZoneRef.current) {
      dropZoneRef.current.style.background = "";
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (dropZoneRef.current) {
      dropZoneRef.current.style.background = "";
    }
    const text = e.dataTransfer.getData("text/plain");
    if (text) handleAdd(text);
  };

  const handleFallbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAdd(fallbackUrl);
  };

  return (
    <div>
      {/* Mobile clipboard toast */}
      {toast && (
        <div className="fixed top-20 right-4 left-4 z-[200] mx-auto flex max-w-[620px] items-center gap-3.5 rounded-[18px] border-3 border-black bg-white p-4 animate-[toast-in_0.3s_ease-out_both]">
          <span className="shrink-0 text-xl">&#x1F4CB;</span>
          <p className="flex-1 font-body text-sm font-semibold leading-snug">
            Spotify link detected -- <strong className="text-pink">Add it?</strong>
          </p>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => {
                setToast(null);
                handleAdd(toast.url);
              }}
              className="rounded-[10px] bg-pink px-4 py-2 font-display text-xs font-bold text-white transition-transform active:scale-95"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="rounded-[10px] bg-gray-100 px-4 py-2 font-display text-xs font-bold text-gray-500 transition-transform active:scale-95"
            >
              Nah
            </button>
          </div>
        </div>
      )}

      {/* Drop zone */}
      <div
        ref={dropZoneRef}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`relative cursor-pointer overflow-hidden rounded-[var(--radius-xl)] border-[3px] border-dashed text-center transition-all ${
          isResolving
            ? "border-pink bg-pink/[0.08]"
            : flashBorder
              ? "border-pink bg-pink/[0.03]"
              : "border-pink/50 animate-[breathe_3s_ease-in-out_infinite] hover:bg-pink/[0.03]"
        } px-8 py-11`}
      >
        {isResolving ? (
          <div className="flex items-center justify-center gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-3 border-gray-200 border-t-pink" />
            <span className="font-display text-[0.95rem] font-bold text-pink">
              Resolving song...
            </span>
          </div>
        ) : (
          <div>
            {/* Icon */}
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-pink/10">
              <MusicNote weight="bold" size={24} className="text-pink" />
            </div>

            <p className="font-display text-lg font-bold text-black">
              Paste a link anywhere
            </p>
            <p className="mt-2 font-body text-sm font-medium text-gray-500">
              <kbd className="rounded-md border-2 border-gray-200 bg-gray-50 px-2 py-0.5 font-body text-xs font-semibold text-black">
                &#8984;V
              </kbd>{" "}
              or drop a link
            </p>
            <button
              type="button"
              onClick={() => setShowFallback(!showFallback)}
              className="mt-3.5 font-body text-xs text-gray-400 underline underline-offset-[3px] transition-colors hover:text-pink"
            >
              or type a link
            </button>
          </div>
        )}
      </div>

      {/* Fallback input */}
      {showFallback && (
        <form onSubmit={handleFallbackSubmit} className="mt-4">
          <div className="flex items-center gap-3 rounded-[18px] border-3 border-black bg-white py-1 pr-1 pl-5">
            <input
              type="text"
              value={fallbackUrl}
              onChange={(e) => {
                setFallbackUrl(e.target.value);
                if (error) setError(null);
              }}
              placeholder="https://open.spotify.com/track/..."
              className="min-w-0 flex-1 border-none bg-transparent py-3 font-body text-[0.95rem] font-medium text-black outline-none placeholder:text-gray-300"
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="shrink-0 rounded-[13px]"
              disabled={addSong.isPending || !fallbackUrl.trim()}
            >
              {addSong.isPending ? "..." : "Add"}
            </Button>
          </div>
        </form>
      )}

      {error && (
        <p className="mt-2 font-body text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
