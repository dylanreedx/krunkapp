import { redirect } from "next/navigation";
import Link from "next/link";
import { CaretLeft } from "@phosphor-icons/react/dist/ssr";

import { getSession } from "@/server/better-auth/server";
import { api, HydrateClient } from "@/trpc/server";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  void api.user.getProfile.prefetch();

  return (
    <HydrateClient>
      <div className="min-h-screen bg-white">
        {/* Top bar */}
        <nav className="flex items-center justify-between border-b-3 border-black px-6 py-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wide text-gray-600 transition-colors hover:text-black"
          >
            <CaretLeft weight="bold" size={18} className="shrink-0" />
            Dashboard
          </Link>
          <span className="font-display text-xl font-extrabold uppercase tracking-tight">
            krunk
          </span>
          {/* Spacer for centering */}
          <div className="w-[100px]" />
        </nav>

        <main className="mx-auto max-w-lg px-6 py-10">
          <h1 className="mb-8 font-display text-3xl font-extrabold uppercase tracking-tight">
            Settings
          </h1>
          <SettingsForm />
        </main>
      </div>
    </HydrateClient>
  );
}
