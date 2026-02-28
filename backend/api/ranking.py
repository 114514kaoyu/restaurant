"""排名计算与查询接口"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from database import get_db
from schemas.ranking import RankingCalculateRequest
from services.ranker import RankingService
from services.recommender import Recommender

router = APIRouter(prefix="/api/ranking", tags=["排名"])


@router.post("/calculate")
def calculate_ranking(
    request: RankingCalculateRequest,
    db: Session = Depends(get_db),
):
    """触发排名计算"""
    service = RankingService(db)
    count = service.calculate_ranking(
        snapshot_id=request.snapshot_id,
        algorithm=request.algorithm,
        confidence=request.confidence,
        weights=request.weights,
        filters=request.filters,
    )
    return {
        "message": f"排名计算完成, 共 {count} 家餐厅参与排名",
        "count": count,
        "algorithm": request.algorithm,
    }


@router.get("/list")
def get_ranking_list(
    snapshot_id: int = Query(...),
    algorithm: str = Query("wilson"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    category: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    keyword: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """获取排名列表 (带筛选与分页)"""
    service = RankingService(db)
    return service.get_ranking_list(
        snapshot_id=snapshot_id,
        algorithm=algorithm,
        page=page,
        page_size=page_size,
        category=category,
        district=district,
        min_price=min_price,
        max_price=max_price,
        keyword=keyword,
    )


@router.get("/compare")
def compare_algorithms(
    snapshot_id: int = Query(...),
    top_n: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """对比四种算法的排名差异"""
    service = RankingService(db)
    return service.compare_algorithms(snapshot_id, top_n)


@router.get("/hidden-gems")
def get_hidden_gems(
    snapshot_id: int = Query(...),
    algorithm: str = Query("wilson"),
    top_n: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """获取隐藏宝藏列表"""
    recommender = Recommender(db)
    return recommender.find_hidden_gems(snapshot_id, algorithm, top_n)


@router.get("/recommend")
def personalized_recommend(
    snapshot_id: int = Query(...),
    algorithm: str = Query("wilson"),
    categories: Optional[str] = Query(None, description="菜系, 逗号分隔"),
    max_price: Optional[float] = Query(None),
    center_lat: Optional[float] = Query(None),
    center_lng: Optional[float] = Query(None),
    radius_km: Optional[float] = Query(None),
    top_n: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """个性化推荐"""
    cat_list = [c.strip() for c in categories.split(",")] if categories else None
    recommender = Recommender(db)
    return recommender.personalized_recommend(
        snapshot_id=snapshot_id,
        algorithm=algorithm,
        categories=cat_list,
        max_price=max_price,
        center_lat=center_lat,
        center_lng=center_lng,
        radius_km=radius_km,
        top_n=top_n,
    )