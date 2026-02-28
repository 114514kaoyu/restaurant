"""排名相关请求/响应模型"""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict


class RankingCalculateRequest(BaseModel):
    """排名计算请求"""
    snapshot_id: int
    algorithm: str = "wilson"                      # naive / bayesian / wilson / weighted
    confidence: float = 0.99                       # Wilson 置信度
    weights: Optional[Dict[str, float]] = None     # 加权算法权重
    filters: Optional[Dict] = None                 # {min_reviews, category, district}


class RankingResponse(BaseModel):
    id: int
    restaurant_id: int
    snapshot_id: int
    algorithm: str
    score: float
    rank: int
    confidence: Optional[float] = None
    calculated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class HiddenGemResponse(BaseModel):
    """隐藏宝藏"""
    restaurant_id: int
    name: str
    category: Optional[str] = None
    rating: Optional[float] = None
    rating_count: int = 0
    cost_avg: Optional[float] = None
    rank: int
    score: float
    district: Optional[str] = None
    latitude: float = 0
    longitude: float = 0
    address: Optional[str] = None
    reason: str = ""