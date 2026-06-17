import { CO2_PER_KWH, RATE_DAY, RATE_NIGHT, REF_KWH } from "./config";
import { catalogMap, PALETTE, RECO_META } from "./catalog";

export type DeviceInput = { device_id: string; hours: number };

function kwhMonth(watts: number, hours: number) {
  return (watts / 1000) * hours * 30;
}

function buildRecos(rows: { device: { id: string; name: string; shift: boolean }; kwh: number; cost: number }[]) {
  const recos: { id: string; type: string; title: string; save: number; pct: number }[] = [];
  for (const x of rows) {
    const d = x.device;
    if (d.shift) {
      recos.push({
        id: `sh-${d.id}`,
        type: "shift",
        title: `${d.name} → gece tarifesi (23:00+)`,
        save: x.kwh * (RATE_DAY - RATE_NIGHT),
        pct: 95,
      });
    }
    if (d.id === "ac") recos.push({ id: "ac", type: "ac", title: "Klimayı 1°C yukarı al", save: x.cost * 0.07, pct: 55 });
    if (d.id === "light") recos.push({ id: "led", type: "led", title: "LED aydınlatmaya geç", save: x.cost * 0.8, pct: 88 });
  }
  return recos.filter((r) => r.save >= 5).sort((a, b) => b.save - a.save).slice(0, 4);
}

export function analyze(devicesInput: DeviceInput[], appliedRecoIds: string[] = []) {
  const catalog = catalogMap();
  const rows = devicesInput
    .filter((e) => catalog[e.device_id])
    .map((e) => {
      const base = catalog[e.device_id];
      const device = { ...base, h: e.hours };
      const kwh = kwhMonth(device.w, e.hours);
      const cost = kwh * RATE_DAY;
      return { device, kwh, cost };
    })
    .sort((a, b) => b.cost - a.cost);

  const totalTl = rows.reduce((s, x) => s + x.cost, 0);
  const totalKwh = rows.reduce((s, x) => s + x.kwh, 0);
  const recos = buildRecos(rows).map((r) => ({
    ...r,
    meta: RECO_META[r.type as keyof typeof RECO_META] || RECO_META.shift,
  }));
  const potential = recos.reduce((s, r) => s + r.save, 0);
  const saved = recos.filter((r) => appliedRecoIds.includes(r.id)).reduce((s, r) => s + r.save, 0);
  const diffPct = ((totalKwh - REF_KWH) / REF_KWH) * 100;
  const score = Math.round(Math.max(18, Math.min(96, 100 - diffPct * 0.75)));

  const chart = rows.map((row, i) => ({
    device_id: row.device.id,
    icon: row.device.icon,
    name: row.device.name,
    kwh: Math.round(row.kwh * 10) / 10,
    cost: Math.round(row.cost * 100) / 100,
    pct: totalTl ? Math.round((row.cost / totalTl) * 1000) / 10 : 0,
    color: PALETTE[i % PALETTE.length],
  }));

  let acc = 0;
  const donutStops = chart.map((item) => {
    const start = totalTl ? (acc / totalTl) * 360 : 0;
    acc += item.cost;
    const end = totalTl ? (acc / totalTl) * 360 : 0;
    return { color: item.color, start, end };
  });

  const badges: { text: string }[] = [];
  if (score < 60) badges.push({ text: "🔥 Yüksek fatura" });
  badges.push(totalKwh > 600 ? { text: "⚡ Puant riski" } : { text: "✓ Dengeli profil" });
  if (potential > 100) badges.push({ text: `💰 ${Math.round(potential)} TL potansiyel` });

  return {
    summary: {
      total_tl: Math.round(totalTl * 100) / 100,
      total_kwh: Math.round(totalKwh * 10) / 10,
      potential_tl: Math.round(potential * 100) / 100,
      co2_kg: Math.round(totalKwh * CO2_PER_KWH * 10) / 10,
      score,
      score_label: score >= 70 ? "Verimli Hane" : score >= 45 ? "Geliştirilebilir" : "Yüksek Tüketim",
      score_diff_pct: Math.round(diffPct * 10) / 10,
      score_diff_label: diffPct > 0 ? `${diffPct.toFixed(0)}% ortalamanın üstünde` : `${(-diffPct).toFixed(0)}% ortalamanın altında`,
      score_diff_direction: diffPct > 0 ? "down" : "up",
      bench_label: diffPct > 5 ? "Benzer haneye göre yüksek tüketim" : "Benzer hane profili · 3 zamanlı tarife",
      annual_potential_tl: Math.round((saved || potential) * 12 * 100) / 100,
      ring_color: score >= 70 ? "#22c55e" : score >= 45 ? "#ffd400" : "#ef4444",
    },
    tariffs: { day: RATE_DAY, night: RATE_NIGHT },
    chart,
    donut_stops: donutStops,
    badges,
    recommendations: recos.map((r) => ({
      ...r,
      save: Math.round(r.save * 100) / 100,
      applied: appliedRecoIds.includes(r.id),
    })),
    simulation: {
      before_tl: Math.round(totalTl * 100) / 100,
      after_tl: Math.round((totalTl - saved) * 100) / 100,
      saved_tl: Math.round(saved * 100) / 100,
      annual_saved_tl: Math.round(saved * 12 * 100) / 100,
      pct_reduction: totalTl && saved ? Math.round((saved / totalTl) * 1000) / 10 : 0,
    },
  };
}

export type AnalysisResult = ReturnType<typeof analyze>;
