import * as React from "react";
import { cn } from "@/lib/utils";

type CardProps = React.ComponentPropsWithRef<"div"> & {
  accent?: boolean;
  rotate?: boolean;
};

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, accent = false, rotate = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "border-3 border-black bg-white p-6 rounded-[var(--radius-xl)]",
          accent && "border-l-[4px] border-l-pink",
          rotate && "rotate-[-1deg]",
          className,
        )}
        {...props}
      />
    );
  },
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithRef<"div">
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("mb-4 space-y-1", className)} {...props} />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.ComponentPropsWithRef<"h3">
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-xl font-bold font-display", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithRef<"div">
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("text-muted", className)} {...props} />
));
CardContent.displayName = "CardContent";

export { Card, CardHeader, CardTitle, CardContent, type CardProps };
