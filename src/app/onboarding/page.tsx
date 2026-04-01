import { redirect } from "next/navigation";
import { getSession } from "@/server/better-auth/server";
import { db } from "@/server/db";
import { eq } from "drizzle-orm";
import { user } from "@/server/db/schema";
import { OnboardingForm } from "./onboarding-form";

type Props = {
  searchParams: Promise<{ redirect?: string }>;
};

export default async function OnboardingPage({ searchParams }: Props) {
  const { redirect: redirectTo } = await searchParams;
  const session = await getSession();

  if (!session) redirect("/");

  // Check if user already has a display name — if so, skip onboarding
  const userData = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
    columns: { displayName: true, phoneNumber: true, avatarId: true },
  });

  if (userData?.displayName) {
    redirect(redirectTo ?? "/dashboard");
  }

  return (
    <main className="relative min-h-screen bg-white">
      <div className="dot-grid pointer-events-none fixed inset-0 z-0 opacity-[0.04]" />
      <div className="relative z-[1] mx-auto flex min-h-screen max-w-[440px] flex-col items-center justify-center px-6 py-12">
        <OnboardingForm
          redirectTo={redirectTo ?? "/dashboard"}
          currentAvatarId={userData?.avatarId ?? "smile-pink"}
        />
      </div>
    </main>
  );
}
