from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.config import settings
from app.database import HouseholdProfile, User, get_db
from app.schemas import devices_from_json, recos_from_json
from app.services.calculator import analyze

router = APIRouter(prefix="/admin", tags=["admin"])


def require_admin(x_admin_key: str | None = Header(default=None)):
    if not x_admin_key or x_admin_key != settings.admin_api_key:
        raise HTTPException(401, "Invalid admin key")


@router.get("/pilot-stats")
def pilot_stats(db: Session = Depends(get_db), _: None = Depends(require_admin)):
    profiles = db.query(HouseholdProfile).order_by(HouseholdProfile.updated_at.desc()).all()
    users = db.query(User).count()

    total_profiles = len(profiles)
    total_kwh = 0.0
    total_tl = 0.0
    total_potential = 0.0
    total_saved = 0.0
    shift_adopters = 0
    rows = []

    for p in profiles:
        devices = devices_from_json(p.devices_json)
        applied = recos_from_json(p.applied_recos_json)
        if not devices:
            continue
        result = analyze([d.model_dump() for d in devices], applied)
        s = result["summary"]
        sim = result["simulation"]
        total_kwh += s["total_kwh"]
        total_tl += s["total_tl"]
        total_potential += s["potential_tl"]
        total_saved += sim["saved_tl"]
        has_shift = any(r.startswith("sh-") for r in applied)
        if has_shift:
            shift_adopters += 1
        rows.append({
            "id": p.id,
            "name": p.name,
            "user_id": p.user_id,
            "total_tl": s["total_tl"],
            "total_kwh": s["total_kwh"],
            "potential_tl": s["potential_tl"],
            "saved_tl": sim["saved_tl"],
            "score": s["score"],
            "shift_adopted": has_shift,
            "updated_at": p.updated_at.isoformat(),
        })

    active = len(rows)
    setup_rate = round(active / max(users, 1) * 100, 1) if users else 100.0
    adoption_rate = round(shift_adopters / max(active, 1) * 100, 1) if active else 0.0

    # Rough MW equivalent: shifted kWh from night tariff recos * households / 1000 / peak hours
    avg_shift_kwh = (total_saved / max(shift_adopters, 1)) / settings.rate_day if shift_adopters else 0
    mw_equivalent = round(avg_shift_kwh * shift_adopters / 1000 / 5, 3)

    return {
        "cohort": {
            "registered_users": users,
            "household_profiles": total_profiles,
            "analyzed_profiles": active,
            "setup_completion_pct": setup_rate,
            "recommendation_adoption_pct": adoption_rate,
            "shift_adopters": shift_adopters,
        },
        "energy": {
            "aggregate_monthly_kwh": round(total_kwh, 1),
            "aggregate_monthly_tl": round(total_tl, 2),
            "aggregate_potential_tl": round(total_potential, 2),
            "aggregate_saved_tl": round(total_saved, 2),
            "estimated_mw_shifted": mw_equivalent,
        },
        "profiles": rows[:100],
    }
