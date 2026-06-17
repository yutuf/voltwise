import { NextResponse } from "next/server";
import { createToken, verifyPassword } from "@/lib/auth";
import { ensureSchema, getSql, hasDb } from "@/lib/db";

export async function POST(req: Request) {
  if (!hasDb()) {
    return NextResponse.json({ detail: "Database not configured" }, { status: 503 });
  }
  await ensureSchema();
  const sql = getSql()!;
  const { email, password } = await req.json();
  const rows = await sql`SELECT * FROM users WHERE email = ${email}`;
  const user = rows[0];
  if (!user || !(await verifyPassword(password, user.hashed_password as string))) {
    return NextResponse.json({ detail: "Invalid email or password" }, { status: 401 });
  }
  const token = await createToken(user.id as number);
  return NextResponse.json({ access_token: token, token_type: "bearer" });
}
