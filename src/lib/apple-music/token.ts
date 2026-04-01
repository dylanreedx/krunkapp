import { SignJWT, importPKCS8 } from "jose";
import { env } from "@/env";

/**
 * Generates an Apple Music developer token (JWT) signed with the MusicKit private key.
 * Valid for 6 months (Apple's maximum).
 */
export async function generateDeveloperToken(): Promise<string> {
  const teamId = env.APPLE_MUSIC_TEAM_ID;
  const keyId = env.APPLE_MUSIC_KEY_ID;
  const privateKey = env.APPLE_MUSIC_PRIVATE_KEY;

  if (!teamId || !keyId || !privateKey) {
    throw new Error(
      "Missing Apple Music credentials: APPLE_MUSIC_TEAM_ID, APPLE_MUSIC_KEY_ID, APPLE_MUSIC_PRIVATE_KEY are required",
    );
  }

  // Apple provides a PKCS#8 ES256 private key
  const key = await importPKCS8(privateKey, "ES256");

  const now = Math.floor(Date.now() / 1000);
  const sixMonths = 15777000; // ~6 months in seconds

  return new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: keyId })
    .setIssuer(teamId)
    .setIssuedAt(now)
    .setExpirationTime(now + sixMonths)
    .sign(key);
}
