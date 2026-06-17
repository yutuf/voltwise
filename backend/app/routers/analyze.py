from fastapi import APIRouter

from app.schemas import AnalyzeRequest
from app.services.calculator import analyze

router = APIRouter(prefix="/analyze", tags=["analyze"])


@router.post("")
def run_analysis(body: AnalyzeRequest):
    devices = [d.model_dump() for d in body.devices]
    return analyze(devices, body.applied_reco_ids)
