import { NextResponse } from "next/server";
import { analyze } from "@/lib/calculator";
import { ADMIN_API_KEY } from "@/lib/config";
import { ensureSchema, getSql, hasDb } from "@/lib/db";

export async function GET(req: Request) {
  const key = req.headers.get("x-admin-key");
  if (key !== ADMIN_API_KEY) {
    return NextResponse.json({ detail: "Invalid admin key" }, { status: 401 });
  }
  if (!hasDb()) {
    return NextResponse.json({
      cohort: { registered_users: 0, household_profiles: 0, analyzed_profiles: 0, setup_completion_pct: 0, recommendation_adoption_pct: 0, shift_adopters: 0 },
      energy: { aggregate_monthly_kwh: 0, aggregate_monthly_tl: 0, aggregate_potential_tl: 0, aggregate_saved_tl: 0, estimated_mw_shifted: 0 },
      profiles: [],
      note: "Connect Neon Postgres in Vercel dashboard",
    });
  }
  await ensureSchema();
  const sql = getSql()!;
  const profiles = await sql`SELECT * FROM household_profiles ORDER BY updated_at DESC`;
  const users = await sql`SELECT COUNT(*)::int AS c FROM users`;
  const userCount = users[0]?.c ?? 0;

  let totalKwh = 0, totalTl = 0, totalPotential = 0, totalSaved = 0, shiftAdopters = 0;
  const rows = [];

  for (const p of profiles) {
    const devices = JSON.parse(p.devices_json as string);
    const applied = JSON.parse(p.applied_recos_json as string);
    if (!devices.length) continue;
    const result = analyze(devices, applied);
    const s = result.summary;
    const sim = result.simulation;
    totalKwh += s.total_kwh;
    totalTl += s.total_tl;
    totalPotential += s.potential_tl;
    totalSaved += sim.saved_tl;
    const hasShift = applied.some((r: string) => r.startsWith("sh-"));
    if (hasShift) shiftAdopters++;
    rows.push({
      id: p.id,
      name: p.name,
      user_id: p.user_id,
      total_tl: s.total_tl,
      total_kwh: s.total_kwh,
      potential_tl: s.potential_tl,
      saved_tl: sim.saved_tl,
      score: s.score,
      shift_adopted: hasShift,
      updated_at: p.updated_at,
    });
  }

  const active = rows.length;
  return NextResponse.json({
    cohort: {
      registered_users: userCount,
      household_profiles: profiles.length,
      analyzed_profiles: active,
      setup_completion_pct: userCount ? Math.round((active / userCount) * 1000) / 10 : 100,
      recommendation_adoption_pct: active ? Math.round((shiftAdopters / active) * 1000) / 10 : 0,
      shift_adopters: shiftAdopters,
    },
    energy: {
      aggregate_monthly_kwh: Math.round(totalKwh * 10) / 10,
      aggregate_monthly_tl: Math.round(totalTl * 100) / 100,
      aggregate_potential_tl: Math.round(totalPotential * 100) / 100,
      aggregate_saved_tl: Math.round(totalSaved * 100) / 100,
      estimated_mw_shifted: shiftAdopters ? Math.round(((totalSaved / shiftAdopters / 2.4) * shiftAdopters) / 1000 / 5 * 1000) / 1000 : 0,
    },
    profiles: rows.slice(0, 100),
  });
}
