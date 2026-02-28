"""餐厅查询接口"""
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional

from database import get_db
from models.restaurant import Restaurant

router = APIRouter(prefix="/api/restaurants", tags=["餐厅"])


@router.get("")
def list_restaurants(
    snapshot_id: int = Query(...),
    category: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    min_rating: Optional[float] = Query(None),
    max_rating: Optional[float] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    min_reviews: Optional[int] = Query(None),
    keyword: Optional[str] = Query(None),
    only_valid: bool = Query(True),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort_by: str = Query("rating"),
    sort_order: str = Query("desc"),
    db: Session = Depends(get_db),
):
    """分页查询餐厅列表 (支持多维筛选和排序)"""
    query = db.query(Restaurant).filter(Restaurant.snapshot_id == snapshot_id)

    if only_valid:
        query = query.filter(Restaurant.is_valid == True)
    if category:
        query = query.filter(Restaurant.category == category)
    if district:
        query = query.filter(Restaurant.district == district)
    if min_rating is not None:
        query = query.filter(Restaurant.rating >= min_rating)
    if max_rating is not None:
        query = query.filter(Restaurant.rating <= max_rating)
    if min_price is not None:
        query = query.filter(Restaurant.cost_avg >= min_price)
    if max_price is not None:
        query = query.filter(Restaurant.cost_avg <= max_price)
    if min_reviews is not None:
        query = query.filter(Restaurant.rating_count >= min_reviews)
    if keyword:
        query = query.filter(Restaurant.name.contains(keyword))

    total = query.count()

    # 排序
    sort_col = getattr(Restaurant, sort_by, Restaurant.rating)
    query = (
        query.order_by(sort_col.desc())
        if sort_order == "desc"
        else query.order_by(sort_col.asc())
    )

    restaurants = query.offset((page - 1) * page_size).limit(page_size).all()

    items = [
        {
            "id": r.id,
            "snapshot_id": r.snapshot_id,
            "poi_id": r.poi_id,
            "name": r.name,
            "category": r.category,
            "sub_category": r.sub_category,
            "rating": r.rating,
            "rating_count": r.rating_count,
            "cost_avg": r.cost_avg,
            "latitude": r.latitude,
            "longitude": r.longitude,
            "address": r.address,
            "district": r.district,
            "tel": r.tel,
            "business_hours": r.business_hours,
            "is_valid": r.is_valid,
        }
        for r in restaurants
    ]

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


@router.get("/categories")
def get_categories(snapshot_id: int = Query(...), db: Session = Depends(get_db)):
    """获取该快照下所有菜系分类及数量"""
    results = (
        db.query(Restaurant.category, func.count(Restaurant.id).label("count"))
        .filter(
            Restaurant.snapshot_id == snapshot_id,
            Restaurant.is_valid == True,
            Restaurant.category.isnot(None),
        )
        .group_by(Restaurant.category)
        .order_by(func.count(Restaurant.id).desc())
        .all()
    )
    return [{"category": r.category, "count": r.count} for r in results]


@router.get("/districts")
def get_districts(snapshot_id: int = Query(...), db: Session = Depends(get_db)):
    """获取该快照下所有区域及数量"""
    results = (
        db.query(Restaurant.district, func.count(Restaurant.id).label("count"))
        .filter(
            Restaurant.snapshot_id == snapshot_id,
            Restaurant.is_valid == True,
            Restaurant.district.isnot(None),
            Restaurant.district != "",
        )
        .group_by(Restaurant.district)
        .order_by(func.count(Restaurant.id).desc())
        .all()
    )
    return [{"district": r.district, "count": r.count} for r in results]


@router.get("/{restaurant_id}")
def get_restaurant(restaurant_id: int, db: Session = Depends(get_db)):
    """获取单个餐厅详情"""
    r = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="餐厅不存在")

    return {
        "id": r.id,
        "snapshot_id": r.snapshot_id,
        "poi_id": r.poi_id,
        "name": r.name,
        "category": r.category,
        "sub_category": r.sub_category,
        "rating": r.rating,
        "rating_count": r.rating_count,
        "cost_avg": r.cost_avg,
        "latitude": r.latitude,
        "longitude": r.longitude,
        "address": r.address,
        "district": r.district,
        "tel": r.tel,
        "business_hours": r.business_hours,
        "is_valid": r.is_valid,
        "invalid_reason": r.invalid_reason,
        "created_at": r.created_at.isoformat() if r.created_at else None,
    }