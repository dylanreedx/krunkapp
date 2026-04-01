import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { auth } from "@/server/better-auth";
import { db } from "@/server/db";
import { user, account } from "@/server/db/schema";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { musicUserToken?: string };
    const { musicUserToken } = body;

    if (!musicUserToken) {
      return NextResponse.json(
        { error: "musicUserToken is required" },
        { status: 400 },
      );
    }

    // Validate the token by calling Apple Music API
    const devToken = await getDeveloperToken();
    const amHeaders = {
      Authorization: `Bearer ${devToken}`,
      "Music-User-Token": musicUserToken,
    };

    const storefrontRes = await fetch(
      "https://api.music.apple.com/v1/me/storefront",
      { headers: amHeaders },
    );

    if (!storefrontRes.ok) {
      return NextResponse.json(
        { error: "Invalid Apple Music token" },
        { status: 401 },
      );
    }

    // Apple Music doesn't expose a stable user ID. We hash the Music User Token
    // to derive an identifier. While the token rotates over time, it stays
    // consistent within a single authorize() session. For returning users with
    // an expired token, we fall back to matching by provider type. A production
    // app should pair this with Sign in with Apple for stable identity.
    const appleMusicId = await hashToken(musicUserToken);

    // Check if this exact token hash maps to an existing account
    const existingAccount = await db.query.account.findFirst({
      where: and(
        eq(account.providerId, "apple_music"),
        eq(account.accountId, appleMusicId),
      ),
    });

    if (existingAccount) {
      // Returning user with the same token — update it and sign in
      await db
        .update(account)
        .set({ accessToken: musicUserToken, updatedAt: new Date() })
        .where(eq(account.id, existingAccount.id));

      const email = `${appleMusicId}@applemusic.krunk.app`;
      return await signInAndRespond(email, appleMusicId, request);
    }

    // Check if the current session user already has an Apple Music account
    // (they re-authorized with a new token)
    const currentSession = await auth.api.getSession({
      headers: request.headers,
    });

    if (currentSession?.user) {
      const existingAmAccount = await db.query.account.findFirst({
        where: and(
          eq(account.userId, currentSession.user.id),
          eq(account.providerId, "apple_music"),
        ),
      });

      if (existingAmAccount) {
        // Update the account with the new token
        await db
          .update(account)
          .set({
            accountId: appleMusicId,
            accessToken: musicUserToken,
            updatedAt: new Date(),
          })
          .where(eq(account.id, existingAmAccount.id));

        await db
          .update(user)
          .set({ appleMusicId })
          .where(eq(user.id, currentSession.user.id));

        return NextResponse.json({ success: true, redirect: "/dashboard" });
      }
    }

    // New user: create via better-auth's signUpEmail
    const email = `${appleMusicId}@applemusic.krunk.app`;

    const signUpRes = await auth.api.signUpEmail({
      body: {
        name: "Apple Music User",
        email,
        password: appleMusicId,
      },
      asResponse: true,
      headers: request.headers,
    });

    if (!signUpRes.ok) {
      // User might exist from a previous token — try signing in
      return await signInAndRespond(email, appleMusicId, request);
    }

    // Get the user ID from the signup response to add Apple Music metadata
    const signUpData = (await signUpRes.clone().json()) as {
      user?: { id: string };
    };
    const userId = signUpData?.user?.id;

    if (userId) {
      // Set Apple Music-specific fields on the user
      await db
        .update(user)
        .set({ platformPreference: "apple_music", appleMusicId })
        .where(eq(user.id, userId));

      // Create the Apple Music account record
      await db.insert(account).values({
        userId,
        accountId: appleMusicId,
        providerId: "apple_music",
        accessToken: musicUserToken,
      });
    }

    const response = NextResponse.json({
      success: true,
      redirect: "/dashboard",
    });
    forwardAuthCookies(signUpRes, response);
    return response;
  } catch (error) {
    console.error("Apple Music auth error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 },
    );
  }
}

/** Sign in an existing user and return a response with session cookies */
async function signInAndRespond(
  email: string,
  password: string,
  request: NextRequest,
) {
  const signInRes = await auth.api.signInEmail({
    body: { email, password },
    asResponse: true,
    headers: request.headers,
  });

  if (!signInRes.ok) {
    return NextResponse.json(
      { error: "Failed to authenticate" },
      { status: 500 },
    );
  }

  const response = NextResponse.json({
    success: true,
    redirect: "/dashboard",
  });
  forwardAuthCookies(signInRes, response);
  return response;
}

/** Forward set-cookie headers from a better-auth Response to our NextResponse */
function forwardAuthCookies(authRes: Response, response: NextResponse) {
  const cookies = authRes.headers.getSetCookie?.();
  if (cookies && cookies.length > 0) {
    for (const cookie of cookies) {
      response.headers.append("set-cookie", cookie);
    }
  } else {
    // Fallback for environments without getSetCookie
    const setCookieHeader = authRes.headers.get("set-cookie");
    if (setCookieHeader) {
      response.headers.set("set-cookie", setCookieHeader);
    }
  }
}

/** Hash a token string to a hex digest via SHA-256 */
async function hashToken(token: string): Promise<string> {
  const data = new TextEncoder().encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Get a developer token for Apple Music API calls */
async function getDeveloperToken(): Promise<string> {
  const { generateDeveloperToken } = await import("@/lib/apple-music/token");
  return generateDeveloperToken();
}
