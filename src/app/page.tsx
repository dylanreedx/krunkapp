import { redirect } from "next/navigation";
import { getSession } from "@/server/better-auth/server";
import { LandingHero } from "./landing-hero";

type Props = {
  searchParams: Promise<{ redirect?: string }>;
};

export default async function Home({ searchParams }: Props) {
  const { redirect: redirectTo } = await searchParams;
  const session = await getSession();

  if (session) {
    redirect(redirectTo ?? "/dashboard");
  }

  return <LandingHero callbackURL={redirectTo ?? "/dashboard"} />;
}
