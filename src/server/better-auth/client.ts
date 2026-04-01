import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL:
    typeof window !== "undefined"
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? "http://127.0.0.1:3000"),
});

export type Session = typeof authClient.$Infer.Session;
