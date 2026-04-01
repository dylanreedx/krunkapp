import { QueueCardSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      {/* Greeting skeleton */}
      <div className="mb-8 space-y-2">
        <div className="h-8 w-48 animate-pulse rounded-[var(--radius-md)] bg-gray-200" />
        <div className="h-4 w-32 animate-pulse rounded-[var(--radius-md)] bg-gray-200" />
      </div>
      {/* Stats skeleton */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-[var(--radius-xl)] border-3 border-gray-200 bg-gray-50"
          />
        ))}
      </div>
      {/* Cards skeleton */}
      <div className="grid gap-5 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <QueueCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
