import * as React from "react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Preset definitions
// ---------------------------------------------------------------------------

type EyeType = "dots" | "lines" | "wink" | "wide";
type MouthType = "smile" | "flat" | "open" | "tongue";

type AvatarPreset = {
  id: string;
  name: string;
  bg: string;
  eyes: EyeType;
  mouth: MouthType;
};

const BG_CYCLE = ["#ff2d78", "#111", "#fff", "#e5e5e5"] as const;

export const AVATARS: AvatarPreset[] = [
  { id: "smile-pink",      name: "Smile",    bg: BG_CYCLE[0], eyes: "dots",  mouth: "smile"  },
  { id: "cool-black",      name: "Cool",     bg: BG_CYCLE[1], eyes: "lines", mouth: "flat"   },
  { id: "wink-outline",    name: "Wink",     bg: BG_CYCLE[2], eyes: "wink",  mouth: "smile"  },
  { id: "chill-gray",      name: "Chill",    bg: BG_CYCLE[3], eyes: "dots",  mouth: "flat"   },
  { id: "grin-pink",       name: "Grin",     bg: BG_CYCLE[0], eyes: "wide",  mouth: "open"   },
  { id: "stoic-black",     name: "Stoic",    bg: BG_CYCLE[1], eyes: "dots",  mouth: "flat"   },
  { id: "tongue-outline",  name: "Tongue",   bg: BG_CYCLE[2], eyes: "dots",  mouth: "tongue" },
  { id: "sleepy-gray",     name: "Sleepy",   bg: BG_CYCLE[3], eyes: "lines", mouth: "smile"  },
  { id: "open-pink",       name: "Wow",      bg: BG_CYCLE[0], eyes: "wide",  mouth: "open"   },
  { id: "flat-black",      name: "Flat",     bg: BG_CYCLE[1], eyes: "lines", mouth: "flat"   },
  { id: "happy-outline",   name: "Happy",    bg: BG_CYCLE[2], eyes: "wide",  mouth: "smile"  },
  { id: "meh-gray",        name: "Meh",      bg: BG_CYCLE[3], eyes: "dots",  mouth: "flat"   },
  { id: "cheeky-pink",     name: "Cheeky",   bg: BG_CYCLE[0], eyes: "wink",  mouth: "tongue" },
  { id: "blank-black",     name: "Blank",    bg: BG_CYCLE[1], eyes: "wide",  mouth: "flat"   },
  { id: "sly-outline",     name: "Sly",      bg: BG_CYCLE[2], eyes: "lines", mouth: "smile"  },
  { id: "yawn-gray",       name: "Yawn",     bg: BG_CYCLE[3], eyes: "lines", mouth: "open"   },
];

// ---------------------------------------------------------------------------
// Face SVG renderer
// ---------------------------------------------------------------------------

/** Determine if the face features should be light (for dark backgrounds). */
function isLight(bg: string): boolean {
  return bg === "#111" || bg === "#ff2d78";
}

function Eyes({ type, color, cx1, cx2, cy }: { type: EyeType; color: string; cx1: number; cx2: number; cy: number }) {
  switch (type) {
    case "dots":
      return (
        <>
          <circle cx={cx1} cy={cy} r={2.4} fill={color} />
          <circle cx={cx2} cy={cy} r={2.4} fill={color} />
        </>
      );
    case "wide":
      return (
        <>
          <circle cx={cx1} cy={cy} r={3.2} fill={color} />
          <circle cx={cx2} cy={cy} r={3.2} fill={color} />
        </>
      );
    case "lines":
      return (
        <>
          <line x1={cx1 - 3} y1={cy} x2={cx1 + 3} y2={cy} stroke={color} strokeWidth={2.4} strokeLinecap="round" />
          <line x1={cx2 - 3} y1={cy} x2={cx2 + 3} y2={cy} stroke={color} strokeWidth={2.4} strokeLinecap="round" />
        </>
      );
    case "wink":
      return (
        <>
          <circle cx={cx1} cy={cy} r={2.4} fill={color} />
          <line x1={cx2 - 3} y1={cy} x2={cx2 + 3} y2={cy} stroke={color} strokeWidth={2.4} strokeLinecap="round" />
        </>
      );
  }
}

function Mouth({ type, color, cx, cy }: { type: MouthType; color: string; cx: number; cy: number }) {
  switch (type) {
    case "smile":
      return (
        <path
          d={`M${cx - 5} ${cy} Q${cx} ${cy + 6} ${cx + 5} ${cy}`}
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          fill="none"
        />
      );
    case "flat":
      return (
        <line
          x1={cx - 4}
          y1={cy + 1}
          x2={cx + 4}
          y2={cy + 1}
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
        />
      );
    case "open":
      return (
        <ellipse cx={cx} cy={cy + 1} rx={3.5} ry={4} fill={color} />
      );
    case "tongue":
      return (
        <>
          <path
            d={`M${cx - 5} ${cy} Q${cx} ${cy + 6} ${cx + 5} ${cy}`}
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            fill="none"
          />
          <ellipse cx={cx} cy={cy + 5} rx={2.5} ry={2} fill="#ff2d78" />
        </>
      );
  }
}

function FaceSvg({ preset, size }: { preset: AvatarPreset; size: number }) {
  const color = isLight(preset.bg) ? "#fff" : "#111";
  // Position eyes and mouth proportionally within a 40x40 viewBox
  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
    >
      <Eyes type={preset.eyes} color={color} cx1={14} cx2={26} cy={16} />
      <Mouth type={preset.mouth} color={color} cx={20} cy={25} />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Avatar component
// ---------------------------------------------------------------------------

const SIZES = { sm: 32, md: 48, lg: 64 } as const;

type AvatarProps = {
  avatarId: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function Avatar({ avatarId, size = "md", className }: AvatarProps) {
  const found = AVATARS.find((a) => a.id === avatarId);
  const preset = found ?? AVATARS[0]!;
  const px = SIZES[size];
  const needsBorder = preset.bg === "#fff" || preset.bg === "#e5e5e5";

  return (
    <div
      className={cn("relative shrink-0 overflow-hidden rounded-full", className)}
      style={{
        width: px,
        height: px,
        backgroundColor: preset.bg,
        border: `3px solid ${needsBorder ? "#111" : preset.bg}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <FaceSvg preset={preset} size={px * 0.75} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// AvatarPicker component
// ---------------------------------------------------------------------------

type AvatarPickerProps = {
  selected: string;
  onSelect: (id: string) => void;
};

export function AvatarPicker({ selected, onSelect }: AvatarPickerProps) {
  return (
    <div className="flex flex-col gap-3">
      <span
        className="text-sm font-bold uppercase tracking-wide"
        style={{ fontFamily: "var(--font-unbounded, 'Unbounded', sans-serif)" }}
      >
        Choose your look
      </span>

      <div className="grid grid-cols-4 gap-3">
        {AVATARS.map((preset) => {
          const isSelected = preset.id === selected;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelect(preset.id)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl p-2 transition-all",
                "hover:bg-gray-100 active:scale-95",
                isSelected && "ring-3 ring-[#ff2d78] ring-offset-2",
              )}
            >
              <Avatar avatarId={preset.id} size="md" />
              <span
                className="text-[10px] font-medium leading-none"
                style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}
              >
                {preset.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
