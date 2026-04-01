"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import { Sparkle } from "@phosphor-icons/react";

type ViewMode = "list" | "card" | "magic";

const STORAGE_KEY = "krunk-queue-view";

type ViewModeCtx = { mode: ViewMode; setMode: (m: ViewMode) => void };

const ViewModeContext = createContext<ViewModeCtx>({
  mode: "list",
  setMode: () => {},
});

export function useViewMode() {
  return useContext(ViewModeContext);
}

/** Wraps children so they can read the current view mode. */
export function ViewModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ViewMode>("list");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ViewMode | null;
    if (stored === "card" || stored === "list" || stored === "magic") {
      setModeState(stored);
    }
  }, []);

  const setMode = (m: ViewMode) => {
    setModeState(m);
    localStorage.setItem(STORAGE_KEY, m);
  };

  return (
    <ViewModeContext.Provider value={{ mode, setMode }}>
      {children}
    </ViewModeContext.Provider>
  );
}

/** Pill segmented toggle: "List" / "Cards" */
export function ViewToggle() {
  const { mode, setMode } = useViewMode();

  return (
    <div className="flex justify-center">
      <div className="flex gap-0.5 rounded-full bg-gray-100 p-1">
        <ToggleButton
          active={mode === "list"}
          onClick={() => setMode("list")}
          label="List view"
        >
          List
        </ToggleButton>
        <ToggleButton
          active={mode === "card"}
          onClick={() => setMode("card")}
          label="Card view"
        >
          Cards
        </ToggleButton>
        <ToggleButton
          active={mode === "magic"}
          onClick={() => setMode("magic")}
          label="Magic shuffle view"
        >
          Magic <Sparkle weight="fill" size={16} className={cn("inline", mode === "magic" ? "text-white" : "text-pink")} />
        </ToggleButton>
      </div>
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "rounded-full px-[22px] py-2.5 font-display text-[0.78rem] font-bold tracking-wide transition-all duration-200",
        active
          ? "bg-pink text-white"
          : "bg-transparent text-gray-400 hover:text-black",
      )}
    >
      {children}
    </button>
  );
}
