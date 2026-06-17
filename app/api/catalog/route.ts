import { NextResponse } from "next/server";
import { DEVICE_CATALOG, RECO_META } from "@/lib/catalog";
import { RATE_DAY, RATE_NIGHT, REF_KWH } from "@/lib/config";

export async function GET() {
  return NextResponse.json({
    devices: DEVICE_CATALOG,
    reco_meta: RECO_META,
    tariffs: { day: RATE_DAY, night: RATE_NIGHT },
    ref_kwh: REF_KWH,
  });
}
