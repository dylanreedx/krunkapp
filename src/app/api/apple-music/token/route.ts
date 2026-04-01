import { NextResponse } from "next/server";

import { generateDeveloperToken } from "@/lib/apple-music/token";

export async function GET() {
  try {
    const developerToken = await generateDeveloperToken();
    return NextResponse.json({ developerToken });
  } catch (error) {
    console.error("Failed to generate Apple Music developer token:", error);
    return NextResponse.json(
      { error: "Failed to generate developer token" },
      { status: 500 },
    );
  }
}
