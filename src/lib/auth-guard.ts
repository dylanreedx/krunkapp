import { redirect } from "next/navigation";

import { getSession } from "@/server/better-auth/server";

/**
 * Server-side auth guard. Call from any server component or page.
 * Redirects to landing page with ?redirect= param if not logged in.
 * Returns the session (guaranteed non-null) on success.
 */
export async function requireAuth(redirectTo?: string) {
  const session = await getSession();

  if (!session) {
    const target = redirectTo ?? "/dashboard";
    redirect(`/?redirect=${encodeURIComponent(target)}`);
  }

  return session;
}
