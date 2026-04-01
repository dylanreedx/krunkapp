"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;

const typeStyles: Record<ToastType, string> = {
  success: "border-pink bg-white text-black",
  error: "border-danger bg-white text-black",
  info: "border-black bg-white text-black",
};

const typeIndicator: Record<ToastType, string> = {
  success: "bg-pink",
  error: "bg-danger",
  info: "bg-black",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Only render portal after mount to avoid hydration mismatch
  useEffect(() => setMounted(true), []);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {mounted &&
        createPortal(
          <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2">
            {toasts.map((t) => (
              <div
                key={t.id}
                role="alert"
                onClick={() => dismiss(t.id)}
                className={cn(
                  "cursor-pointer border-3 px-5 py-3 font-display text-sm font-bold rounded-[var(--radius-lg)] transition-all",
                  "animate-[toast-in_0.2s_ease-out]",
                  typeStyles[t.type],
                )}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-block h-2 w-2 shrink-0 rounded-full",
                      typeIndicator[t.type],
                    )}
                  />
                  {t.message}
                </span>
              </div>
            ))}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}

export function toast(_message: string, _type?: ToastType) {
  console.warn(
    "toast() called outside of React. Use useToast() hook inside a component instead.",
  );
}
