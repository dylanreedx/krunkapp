"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const REACTIONS = ["🔥", "❤️", "🔄", "💀", "🎵"] as const;

type ReactionRowProps = {
  className?: string;
};

export function ReactionRow({ className }: ReactionRowProps) {
  const [active, setActive] = useState<Set<string>>(new Set());

  function toggle(emoji: string) {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(emoji)) {
        next.delete(emoji);
      } else {
        next.add(emoji);
      }
      return next;
    });
  }

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <span className="font-body text-xs text-gray-400">React</span>

      <div className="flex items-center gap-2">
        {REACTIONS.map((emoji) => {
          const isActive = active.has(emoji);
          return (
            <button
              key={emoji}
              type="button"
              onClick={() => toggle(emoji)}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border-[3px] text-base transition-all duration-150",
                isActive
                  ? "border-pink bg-pink scale-110"
                  : "border-black bg-white hover:scale-105",
              )}
            >
              {emoji}
            </button>
          );
        })}
      </div>
    </div>
  );
}
