"use client";

import { cn } from "@/lib/utils";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"] as const;

// Monday=0 .. Sunday=6
const DROP_DAY_INDEX: Record<string, number> = {
  monday: 0,
  tuesday: 1,
  wednesday: 2,
  thursday: 3,
  friday: 4,
  saturday: 5,
  sunday: 6,
};

function getMondayBasedDayIndex(date: Date): number {
  // JS getDay: 0=Sun,1=Mon...6=Sat → convert to 0=Mon...6=Sun
  return (date.getDay() + 6) % 7;
}

function getCountdownText(todayIdx: number, dropIdx: number): string {
  if (todayIdx === dropIdx) return "Dropping today 🔥";
  if (todayIdx > dropIdx) return "Dropped this week ✓";
  const diff = dropIdx - todayIdx;
  return `Drops in ${diff} day${diff === 1 ? "" : "s"}`;
}

type WeekStripProps = {
  dropDay?: "friday" | "sunday";
  onDropEarly?: () => void;
  className?: string;
};

export function WeekStrip({
  dropDay = "friday",
  onDropEarly,
  className,
}: WeekStripProps) {
  const todayIdx = getMondayBasedDayIndex(new Date());
  const dropIdx = DROP_DAY_INDEX[dropDay] ?? 4;
  const countdownText = getCountdownText(todayIdx, dropIdx);
  const isPast = todayIdx > dropIdx;
  const isDropDay = todayIdx === dropIdx;

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      {/* Day circles */}
      <div className="flex items-center gap-2">
        {DAYS.map((letter, i) => {
          const isToday = i === todayIdx;
          const isDrop = i === dropIdx;
          const isPastDay = i < todayIdx;

          return (
            <div
              key={i}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full border-[3px] font-display text-xs font-bold transition-colors",
                // Drop day (takes precedence over today if same day)
                isDrop && "border-pink bg-pink text-white animate-[pulse-pink_2s_ease-in-out_infinite]",
                // Today (only if not also drop day)
                isToday && !isDrop && "border-black bg-black text-white",
                // Past
                isPastDay && !isToday && !isDrop && "border-gray-300 bg-gray-100 text-gray-300",
                // Future / inactive
                !isToday && !isDrop && !isPastDay && "border-gray-300 bg-white text-gray-400",
              )}
            >
              {letter}
            </div>
          );
        })}
      </div>

      {/* Countdown */}
      <p
        className={cn(
          "font-body text-sm",
          isDropDay ? "font-semibold text-pink" : "text-gray-400",
        )}
      >
        {countdownText}
      </p>

      {/* Drop early link */}
      {onDropEarly && !isPast && !isDropDay && (
        <button
          type="button"
          onClick={onDropEarly}
          className="font-body text-xs text-gray-400 underline underline-offset-2 transition-colors hover:text-gray-600"
        >
          Drop early
        </button>
      )}
    </div>
  );
}
