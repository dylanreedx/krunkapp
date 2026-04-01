import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse bg-gray-200 rounded-[var(--radius-md)]", className)} />
  );
}

export function QueueCardSkeleton() {
  return (
    <div className="border-3 border-black bg-white p-6 rounded-[var(--radius-xl)]">
      <div className="mb-4 flex items-start justify-between gap-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="mb-4 flex gap-[-8px]">
        <Skeleton className="h-8 w-8 rounded-[var(--radius-sm)]" />
        <Skeleton className="h-8 w-8 rounded-[var(--radius-sm)] -ml-2" />
        <Skeleton className="h-8 w-8 rounded-[var(--radius-sm)] -ml-2" />
      </div>
      <Skeleton className="mb-2 h-4 w-32" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

export function SongRowSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3">
      <Skeleton className="h-6 w-6 shrink-0 rounded-full" />
      <Skeleton className="h-10 w-10 shrink-0 rounded-[var(--radius-sm)]" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  );
}
