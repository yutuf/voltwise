from fastapi import APIRouter

from app.services.catalog_data import DEVICE_CATALOG, RECO_META
from app.config import settings

router = APIRouter(prefix="/catalog", tags=["catalog"])


@router.get("")
def get_catalog():
    return {
        "devices": DEVICE_CATALOG,
        "reco_meta": RECO_META,
        "palette": [
            "#ffd400", "#38bdf8", "#22c55e", "#f472b6",
            "#fb923c", "#a78bfa", "#f87171", "#2dd4bf",
        ],
        "tariffs": {"day": settings.rate_day, "night": settings.rate_night},
        "ref_kwh": settings.ref_kwh,
    }
