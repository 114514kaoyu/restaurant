"""餐厅相关请求/响应模型"""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class RestaurantResponse(BaseModel):
    id: int
    snapshot_id: int
    poi_id: str
    name: str
    category: Optional[str] = None
    sub_category: Optional[str] = None
    rating: Optional[float] = None
    rating_count: int = 0
    cost_avg: Optional[float] = None
    latitude: float
    longitude: float
    address: Optional[str] = None
    district: Optional[str] = None
    tel: Optional[str] = None
    business_hours: Optional[str] = None
    is_valid: bool = True
    invalid_reason: Optional[str] = None

    class Config:
        from_attributes = True


class RestaurantWithRank(RestaurantResponse):
    """带排名信息的餐厅"""
    rank: Optional[int] = None
    score: Optional[float] = None
    algorithm: Optional[str] = None


class RestaurantFilter(BaseModel):
    """查询筛选参数"""
    snapshot_id: int
    category: Optional[str] = None
    district: Optional[str] = None
    min_rating: Optional[float] = None
    max_rating: Optional[float] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    min_reviews: Optional[int] = None
    keyword: Optional[str] = None
    only_valid: bool = True
    page: int = 1
    page_size: int = 20
    sort_by: str = "rating"
    sort_order: str = "desc"


class PaginatedResponse(BaseModel):
    """分页响应"""
    items: List[dict]
    total: int
    page: int
    page_size: int
    total_pages: int


class SnapshotResponse(BaseModel):
    id: int
    city_id: int
    collected_at: Optional[datetime] = None
    total_count: int = 0
    status: str = "pending"
    note: Optional[str] = None

    class Config:
        from_attributes = True


class CleanReport(BaseModel):
    """数据清洗报告"""
    snapshot_id: int
    total_before: int
    total_after: int
    removed_zero_rating: int
    removed_non_restaurant: int
    removed_duplicates: int
    total_removed: int