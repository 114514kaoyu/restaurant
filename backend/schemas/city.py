"""城市相关请求/响应模型"""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class CityCreate(BaseModel):
    name: str
    province: Optional[str] = None
    center_lat: float
    center_lng: float
    radius_km: float = 15.0


class CityResponse(BaseModel):
    id: int
    name: str
    province: Optional[str] = None
    center_lat: float
    center_lng: float
    radius_km: float
    created_at: Optional[datetime] = None
    snapshot_count: int = 0
    latest_snapshot: Optional[dict] = None

    class Config:
        from_attributes = True