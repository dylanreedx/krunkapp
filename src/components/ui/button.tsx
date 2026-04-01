import * as React from "react";
import { cn } from "@/lib/utils";

const variants = {
  primary:
    "bg-pink text-white font-bold rounded-[var(--radius-md)] hover:bg-pink-dark active:scale-[0.97] transition-all",
  secondary:
    "bg-white text-black border-3 border-black font-bold rounded-[var(--radius-md)] hover:bg-gray-50 active:scale-[0.97] transition-all",
  ghost:
    "bg-transparent text-black font-medium rounded-[var(--radius-md)] hover:bg-gray-100 active:bg-gray-200 transition-colors",
  danger:
    "bg-danger text-white font-bold rounded-[var(--radius-md)] hover:opacity-90 active:scale-[0.97] transition-all",
} as const;

const sizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-5 py-2.5 text-base",
  lg: "px-7 py-3.5 text-lg",
} as const;

type ButtonProps = React.ComponentPropsWithRef<"button"> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex cursor-pointer items-center justify-center font-display",
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, type ButtonProps };
