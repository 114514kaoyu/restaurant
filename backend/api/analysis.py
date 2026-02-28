"""统计分析接口"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from database import get_db
from services.analyzer import DataAnalyzer

router = APIRouter(prefix="/api/analysis", tags=["统计分析"])


@router.get("/overview/{snapshot_id}")
def get_overview(snapshot_id: int, db: Session = Depends(get_db)):
    """总览统计数据"""
    return DataAnalyzer(db).overview(snapshot_id)


@router.get("/category-stats/{snapshot_id}")
def get_category_stats(snapshot_id: int, db: Session = Depends(get_db)):
    """各菜系统计"""
    return DataAnalyzer(db).category_stats(snapshot_id)


@router.get("/district-stats/{snapshot_id}")
def get_district_stats(snapshot_id: int, db: Session = Depends(get_db)):
    """各区域统计"""
    return DataAnalyzer(db).district_stats(snapshot_id)


@router.get("/price-rating/{snapshot_id}")
def get_price_rating(snapshot_id: int, db: Session = Depends(get_db)):
    """价格-评分散点图数据"""
    return DataAnalyzer(db).price_rating_scatter(snapshot_id)


@router.get("/rating-distribution/{snapshot_id}")
def get_rating_distribution(
    snapshot_id: int,
    bin_size: float = Query(0.2, ge=0.1, le=1.0),
    db: Session = Depends(get_db),
):
    """评分分布直方图数据"""
    return DataAnalyzer(db).rating_distribution(snapshot_id, bin_size)


@router.get("/heatmap/{snapshot_id}")
def get_heatmap(
    snapshot_id: int,
    algorithm: Optional[str] = Query(None),
    top_percent: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """热力图数据点"""
    return DataAnalyzer(db).heatmap_data(snapshot_id, algorithm, top_percent)