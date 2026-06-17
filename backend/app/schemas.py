import json
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class DeviceInput(BaseModel):
    device_id: str
    hours: float = Field(gt=0, le=24)


class AnalyzeRequest(BaseModel):
    devices: list[DeviceInput] = Field(min_length=1)
    applied_reco_ids: list[str] = Field(default_factory=list)


class ProfileCreate(BaseModel):
    name: str = "Evim"
    devices: list[DeviceInput]
    applied_reco_ids: list[str] = Field(default_factory=list)


class ProfileUpdate(BaseModel):
    name: str | None = None
    devices: list[DeviceInput] | None = None
    applied_reco_ids: list[str] | None = None


class ProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    devices: list[DeviceInput]
    applied_reco_ids: list[str]
    analysis: dict | None = None
    created_at: datetime
    updated_at: datetime


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str | None = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    name: str | None


def devices_to_json(devices: list[DeviceInput]) -> str:
    return json.dumps([d.model_dump() for d in devices])


def devices_from_json(raw: str) -> list[DeviceInput]:
    return [DeviceInput(**d) for d in json.loads(raw or "[]")]


def recos_to_json(recos: list[str]) -> str:
    return json.dumps(recos)


def recos_from_json(raw: str) -> list[str]:
    return json.loads(raw or "[]")
