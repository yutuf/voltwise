from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import get_current_user, require_user
from app.database import HouseholdProfile, User, get_db
from app.schemas import (
    ProfileCreate,
    ProfileOut,
    ProfileUpdate,
    devices_from_json,
    devices_to_json,
    recos_from_json,
    recos_to_json,
)
from app.services.calculator import analyze

router = APIRouter(prefix="/profiles", tags=["profiles"])


def _profile_out(profile: HouseholdProfile, include_analysis: bool = True) -> ProfileOut:
    devices = devices_from_json(profile.devices_json)
    applied = recos_from_json(profile.applied_recos_json)
    analysis_data = None
    if include_analysis and devices:
        analysis_data = analyze(
            [d.model_dump() for d in devices],
            applied,
        )
    return ProfileOut(
        id=profile.id,
        name=profile.name,
        devices=devices,
        applied_reco_ids=applied,
        analysis=analysis_data,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
    )


@router.get("", response_model=list[ProfileOut])
def list_profiles(
    db: Session = Depends(get_db),
    user: User | None = Depends(get_current_user),
):
    q = db.query(HouseholdProfile)
    if user:
        q = q.filter(HouseholdProfile.user_id == user.id)
    else:
        q = q.filter(HouseholdProfile.user_id.is_(None))
    return [_profile_out(p) for p in q.order_by(HouseholdProfile.updated_at.desc()).all()]


@router.post("", response_model=ProfileOut)
def create_profile(
    body: ProfileCreate,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_current_user),
):
    profile = HouseholdProfile(
        user_id=user.id if user else None,
        name=body.name,
        devices_json=devices_to_json(body.devices),
        applied_recos_json=recos_to_json(body.applied_reco_ids),
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return _profile_out(profile)


@router.get("/{profile_id}", response_model=ProfileOut)
def get_profile(profile_id: int, db: Session = Depends(get_db), user: User | None = Depends(get_current_user)):
    profile = db.query(HouseholdProfile).filter(HouseholdProfile.id == profile_id).first()
    if not profile:
        raise HTTPException(404, "Profile not found")
    if profile.user_id and (not user or profile.user_id != user.id):
        raise HTTPException(403, "Forbidden")
    if profile.user_id is None and user:
        pass  # anonymous profiles readable by anyone with id
    return _profile_out(profile)


@router.put("/{profile_id}", response_model=ProfileOut)
def update_profile(
    profile_id: int,
    body: ProfileUpdate,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_current_user),
):
    profile = db.query(HouseholdProfile).filter(HouseholdProfile.id == profile_id).first()
    if not profile:
        raise HTTPException(404, "Profile not found")
    if profile.user_id and (not user or profile.user_id != user.id):
        raise HTTPException(403, "Forbidden")
    if body.name is not None:
        profile.name = body.name
    if body.devices is not None:
        profile.devices_json = devices_to_json(body.devices)
    if body.applied_reco_ids is not None:
        profile.applied_recos_json = recos_to_json(body.applied_reco_ids)
    db.commit()
    db.refresh(profile)
    return _profile_out(profile)


@router.delete("/{profile_id}")
def delete_profile(profile_id: int, db: Session = Depends(get_db), user: User = Depends(require_user)):
    profile = db.query(HouseholdProfile).filter(HouseholdProfile.id == profile_id).first()
    if not profile or profile.user_id != user.id:
        raise HTTPException(404, "Profile not found")
    db.delete(profile)
    db.commit()
    return {"ok": True}
