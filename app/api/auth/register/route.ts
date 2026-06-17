import { NextResponse } from "next/server";
import { createToken, hashPassword } from "@/lib/auth";
import { ensureSchema, getSql, hasDb } from "@/lib/db";

export async function POST(req: Request) {
  if (!hasDb()) {
    return NextResponse.json({ detail: "Database not configured" }, { status: 503 });
  }
  await ensureSchema();
  const sql = getSql()!;
  const { email, password, name } = await req.json();
  if (!email || !password || password.length < 6) {
    return NextResponse.json({ detail: "Invalid input" }, { status: 400 });
  }
  const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
  if (existing.length) {
    return NextResponse.json({ detail: "Email already registered" }, { status: 400 });
  }
  const hashed = await hashPassword(password);
  const rows = await sql`INSERT INTO users (email, hashed_password, name) VALUES (${email}, ${hashed}, ${name || null}) RETURNING id`;
  const token = await createToken(rows[0].id as number);
  return NextResponse.json({ access_token: token, token_type: "bearer" });
}
