from app.config import settings
from app.services.catalog_data import DEVICE_CATALOG, PALETTE, RECO_META


def _catalog_map():
    return {d["id"]: d for d in DEVICE_CATALOG}


def kwh_month(watts: float, hours: float) -> float:
    return (watts / 1000) * hours * 30


def cost_month(kwh: float) -> float:
    return kwh * settings.rate_day


def build_recommendations(devices: list[dict]) -> list[dict]:
    recos = []
    for item in devices:
        d = item["device"]
        e = item["kwh"]
        c = item["cost"]
        if d["shift"]:
            save = e * (settings.rate_day - settings.rate_night)
            recos.append({
                "id": f"sh-{d['id']}",
                "type": "shift",
                "title": f"{d['name']} → gece tarifesi (23:00+)",
                "save": save,
                "pct": 95,
            })
        if d["id"] == "ac":
            recos.append({
                "id": "ac",
                "type": "ac",
                "title": "Klimayı 1°C yukarı al",
                "save": c * 0.07,
                "pct": 55,
            })
        if d["id"] == "light":
            recos.append({
                "id": "led",
                "type": "led",
                "title": "LED aydınlatmaya geç",
                "save": c * 0.80,
                "pct": 88,
            })
    return sorted(
        [r for r in recos if r["save"] >= 5],
        key=lambda r: r["save"],
        reverse=True,
    )[:4]


def analyze(devices_input: list[dict], applied_reco_ids: list[str] | None = None) -> dict:
    applied_reco_ids = applied_reco_ids or []
    catalog = _catalog_map()

    rows = []
    for entry in devices_input:
        dev_id = entry["device_id"]
        hours = float(entry["hours"])
        if dev_id not in catalog:
            continue
        base = catalog[dev_id]
        device = {**base, "h": hours}
        e = kwh_month(device["w"], hours)
        c = cost_month(e)
        rows.append({"device": device, "kwh": e, "cost": c})

    rows.sort(key=lambda x: x["cost"], reverse=True)
    total_tl = sum(x["cost"] for x in rows)
    total_kwh = sum(x["kwh"] for x in rows)

    recos = build_recommendations(rows)
    for r in recos:
        meta = RECO_META.get(r["type"], RECO_META["shift"])
        r["meta"] = meta

    potential = sum(r["save"] for r in recos)
    saved = sum(r["save"] for r in recos if r["id"] in applied_reco_ids)
    after_tl = total_tl - saved

    diff_pct = ((total_kwh - settings.ref_kwh) / settings.ref_kwh) * 100
    score = round(max(18, min(96, 100 - diff_pct * 0.75)))

    if diff_pct > 5:
        bench_label = "Benzer haneye göre yüksek tüketim"
    else:
        bench_label = "Benzer hane profili · 3 zamanlı tarife"

    if score >= 70:
        score_label = "Verimli Hane"
    elif score >= 45:
        score_label = "Geliştirilebilir"
    else:
        score_label = "Yüksek Tüketim"

    ring_color = "#22c55e" if score >= 70 else "#ffd400" if score >= 45 else "#ef4444"

    badges = []
    if score < 60:
        badges.append({"text": "🔥 Yüksek fatura"})
    if total_kwh > 600:
        badges.append({"text": "⚡ Puant riski"})
    else:
        badges.append({"text": "✓ Dengeli profil"})
    if potential > 100:
        badges.append({"text": f"💰 {potential:.0f} TL potansiyel"})

    chart = []
    for i, row in enumerate(rows):
        pal = PALETTE[i % len(PALETTE)]
        pct = (row["cost"] / total_tl * 100) if total_tl else 0
        chart.append({
            "device_id": row["device"]["id"],
            "icon": row["device"]["icon"],
            "name": row["device"]["name"],
            "kwh": round(row["kwh"], 1),
            "cost": round(row["cost"], 2),
            "pct": round(pct, 1),
            "color": pal,
        })

    # donut stops for conic-gradient
    acc = 0
    stops = []
    for item in chart:
        start = acc / total_tl * 360 if total_tl else 0
        acc += item["cost"]
        end = acc / total_tl * 360 if total_tl else 0
        stops.append({"color": item["color"], "start": start, "end": end})

    return {
        "summary": {
            "total_tl": round(total_tl, 2),
            "total_kwh": round(total_kwh, 1),
            "potential_tl": round(potential, 2),
            "co2_kg": round(total_kwh * settings.co2_per_kwh, 1),
            "score": score,
            "score_label": score_label,
            "score_diff_pct": round(diff_pct, 1),
            "score_diff_label": (
                f"{diff_pct:.0f}% ortalamanın üstünde" if diff_pct > 0
                else f"{-diff_pct:.0f}% ortalamanın altında"
            ),
            "score_diff_direction": "down" if diff_pct > 0 else "up",
            "bench_label": bench_label,
            "annual_potential_tl": round((saved if saved else potential) * 12, 2),
            "ring_color": ring_color,
        },
        "tariffs": {
            "day": settings.rate_day,
            "night": settings.rate_night,
        },
        "chart": chart,
        "donut_stops": stops,
        "badges": badges,
        "recommendations": [
            {
                **r,
                "save": round(r["save"], 2),
                "applied": r["id"] in applied_reco_ids,
            }
            for r in recos
        ],
        "simulation": {
            "before_tl": round(total_tl, 2),
            "after_tl": round(after_tl, 2),
            "saved_tl": round(saved, 2),
            "annual_saved_tl": round(saved * 12, 2),
            "pct_reduction": round(saved / total_tl * 100, 1) if total_tl and saved else 0,
        },
    }
