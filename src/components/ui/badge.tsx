import { cn } from "@/lib/utils";

type BadgeProps = {
  children: React.ReactNode;
  variant?: "pink" | "black" | "outline";
  className?: string;
};

export function Badge({ children, variant = "pink", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center px-2.5 py-0.5 font-display text-xs font-bold rounded-full",
        variant === "pink" && "bg-pink text-white",
        variant === "black" && "bg-black text-white",
        variant === "outline" && "border-2 border-black text-black",
        className,
      )}
    >
      {children}
    </span>
  );
}
