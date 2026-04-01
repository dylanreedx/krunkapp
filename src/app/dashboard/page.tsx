import { redirect } from "next/navigation";
import Link from "next/link";
import { GearSix } from "@phosphor-icons/react/dist/ssr";

import { requireAuth } from "@/lib/auth-guard";
import { HydrateClient, api } from "@/trpc/server";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { WeekStrip } from "@/components/ui/week-strip";
import { QueueList } from "./_components/queue-list";

function getWeekLabel() {
  const now = new Date();
  return now.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

export default async function DashboardPage() {
  const session = await requireAuth("/dashboard");

  // Check if user needs onboarding (no display name set)
  const { db } = await import("@/server/db");
  const { eq } = await import("drizzle-orm");
  const { user: userTable } = await import("@/server/db/schema");
  const userData = await db.query.user.findFirst({
    where: eq(userTable.id, session.user.id),
    columns: { displayName: true },
  });
  if (!userData?.displayName) {
    redirect("/onboarding?redirect=/dashboard");
  }

  // Prefetch queues for client components
  void api.queue.list.prefetch();

  const user = session.user;
  const firstName = (userData.displayName ?? user.name ?? user.email ?? "").split(/[\s@]/)[0];
  const weekLabel = getWeekLabel();

  return (
    <HydrateClient>
      <div className="dot-grid relative min-h-screen bg-white pb-28 md:pb-10">
        {/* Dot grid overlay for subtle effect */}
        <div className="pointer-events-none fixed inset-0 z-0 bg-white/[0.96]" />

        {/* Top bar */}
        <header className="sticky top-0 z-50 flex items-center justify-between border-b-[3px] border-black bg-white/90 px-6 py-4 backdrop-blur-xl md:px-8">
          <Link
            href="/dashboard"
            className="font-display text-2xl font-black tracking-tight"
          >
            krun<span className="text-pink">k</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/settings"
              className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] transition-colors hover:bg-gray-100"
            >
              <GearSix weight="bold" size={22} className="text-black" />
            </Link>
            <Avatar
              avatarId={(user as Record<string, unknown>).avatarId as string ?? "smile-pink"}
              size="sm"
              className="cursor-pointer transition-transform hover:scale-110"
            />
          </div>
        </header>

        {/* Main content */}
        <main className="relative z-10 mx-auto max-w-[860px] px-6 pt-10 md:px-8">
          {/* Greeting */}
          <div className="mb-2 animate-[slide-from-left_0.6s_cubic-bezier(0.16,1,0.3,1)_0.1s_both]">
            <h1 className="font-display text-[clamp(2.2rem,6vw,3.4rem)] font-black leading-[1.05] tracking-tighter">
              Hey {firstName}
            </h1>
            <p className="mt-1.5 font-body text-base font-medium text-gray-500">
              Week of {weekLabel}
            </p>
          </div>

          {/* Week strip */}
          <div className="mb-9 animate-[fade-up_0.5s_cubic-bezier(0.16,1,0.3,1)_0.2s_both]">
            <WeekStrip dropDay="friday" />
          </div>

          {/* Stats row */}
          <div className="mb-10 grid grid-cols-3 gap-4">
            <Card className="animate-[fade-up_0.5s_cubic-bezier(0.16,1,0.3,1)_0.35s_both] p-5 text-center transition-transform hover:-translate-y-1">
              <div className="font-display text-[2.4rem] font-black leading-none">
                7
              </div>
              <div className="mt-1 font-body text-[0.82rem] font-semibold uppercase tracking-wider text-gray-500">
                Queues Sent
              </div>
            </Card>
            <Card className="animate-[fade-up_0.5s_cubic-bezier(0.16,1,0.3,1)_0.42s_both] border-pink bg-pink p-5 text-center transition-transform hover:-translate-y-1">
              <div className="font-display text-[2.4rem] font-black leading-none text-white">
                34
              </div>
              <div className="mt-1 font-body text-[0.82rem] font-semibold uppercase tracking-wider text-white">
                Songs Shared
              </div>
            </Card>
            <Card className="animate-[fade-up_0.5s_cubic-bezier(0.16,1,0.3,1)_0.49s_both] p-5 text-center transition-transform hover:-translate-y-1">
              <div className="font-display text-[2.4rem] font-black leading-none">
                4
              </div>
              <div className="mt-1 font-body text-[0.82rem] font-semibold uppercase tracking-wider text-gray-500">
                Friends
              </div>
            </Card>
          </div>

          {/* Queue list (client component) */}
          <QueueList userId={user.id} />
        </main>
      </div>
    </HydrateClient>
  );
}
