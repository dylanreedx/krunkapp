import { SongRowSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-6 h-8 w-56 animate-pulse rounded-[var(--radius-md)] bg-gray-200" />
      <div className="mb-8 h-32 animate-pulse rounded-[var(--radius-xl)] border-3 border-dashed border-gray-200" />
      <div className="space-y-1 rounded-[var(--radius-xl)] border-3 border-gray-200 p-4">
        {[0, 1, 2].map((i) => (
          <SongRowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
