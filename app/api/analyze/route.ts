import { NextResponse } from "next/server";
import { analyze } from "@/lib/calculator";

export async function POST(req: Request) {
  const body = await req.json();
  if (!body.devices?.length) {
    return NextResponse.json({ detail: "devices required" }, { status: 400 });
  }
  return NextResponse.json(analyze(body.devices, body.applied_reco_ids || []));
}
