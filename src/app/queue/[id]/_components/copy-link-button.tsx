"use client";

import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { ShareNetwork, Check } from "@phosphor-icons/react";

export function CopyLinkButton({ className }: { className?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = window.location.href;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, []);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        "inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full border-3 border-black bg-white px-6 py-3 font-display text-[0.78rem] font-bold text-black transition-all hover:-translate-y-0.5 hover:bg-gray-50 active:translate-y-0",
        className,
      )}
    >
      {copied ? (
        <>
          <Check weight="bold" size={18} />
          Copied!
        </>
      ) : (
        <>
          <ShareNetwork weight="bold" size={18} />
          Share
        </>
      )}
    </button>
  );
}
