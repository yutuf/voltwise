import { NextResponse } from "next/server";
import { analyze } from "@/lib/calculator";
import { bearerUserId, createToken, hashPassword, verifyPassword } from "@/lib/auth";
import { ensureSchema, getSql, hasDb } from "@/lib/db";

export async function GET(req: Request) {
  if (!hasDb()) return NextResponse.json([]);
  await ensureSchema();
  const sql = getSql()!;
  const userId = await bearerUserId(req);
  const rows = userId
    ? await sql`SELECT * FROM household_profiles WHERE user_id = ${userId} ORDER BY updated_at DESC`
    : await sql`SELECT * FROM household_profiles WHERE user_id IS NULL ORDER BY updated_at DESC`;
  return NextResponse.json(
    rows.map((p) => {
      const devices = JSON.parse(p.devices_json as string);
      const applied = JSON.parse(p.applied_recos_json as string);
      return {
        id: p.id,
        name: p.name,
        devices,
        applied_reco_ids: applied,
        analysis: devices.length ? analyze(devices, applied) : null,
        created_at: p.created_at,
        updated_at: p.updated_at,
      };
    })
  );
}

export async function POST(req: Request) {
  if (!hasDb()) {
    return NextResponse.json({ detail: "Database not configured. Add Neon Postgres in Vercel." }, { status: 503 });
  }
  await ensureSchema();
  const sql = getSql()!;
  const body = await req.json();
  const userId = await bearerUserId(req);
  const rows = await sql`
    INSERT INTO household_profiles (user_id, name, devices_json, applied_recos_json)
    VALUES (${userId}, ${body.name || "Evim"}, ${JSON.stringify(body.devices)}, ${JSON.stringify(body.applied_reco_ids || [])})
    RETURNING *`;
  const p = rows[0];
  const devices = JSON.parse(p.devices_json as string);
  const applied = JSON.parse(p.applied_recos_json as string);
  return NextResponse.json({
    id: p.id,
    name: p.name,
    devices,
    applied_reco_ids: applied,
    analysis: analyze(devices, applied),
    created_at: p.created_at,
    updated_at: p.updated_at,
  });
}
