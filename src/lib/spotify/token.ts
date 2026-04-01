import { env } from "@/env";

interface TokenResponse {
  accessToken: string;
  expiresIn: number;
}

export class SpotifyTokenError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    super(`Spotify token refresh failed (${status})`);
    this.name = "SpotifyTokenError";
  }
}

/**
 * Get a client credentials token — works for public API calls (track lookup, search)
 * without needing a user's OAuth token.
 */
export async function getClientCredentialsToken(): Promise<TokenResponse> {
  const clientId = env.SPOTIFY_CLIENT_ID;
  const clientSecret = env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET env vars");
  }

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new SpotifyTokenError(res.status, body);
  }

  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
  };
}

export async function refreshSpotifyToken(
  refreshToken: string,
): Promise<TokenResponse> {
  const clientId = env.SPOTIFY_CLIENT_ID;
  const clientSecret = env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET env vars",
    );
  }

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new SpotifyTokenError(res.status, body);
  }

  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
  };
}
