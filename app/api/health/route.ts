import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "voltwise",
    version: "1.0.0",
    platform: "vercel",
    database: Boolean(process.env.DATABASE_URL || process.env.POSTGRES_URL),
  });
}
