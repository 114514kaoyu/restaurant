"""
统计分析服务
提供总览统计、菜系统计、区域统计、分布数据、热力图数据等
"""
import logging
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from models.restaurant import Restaurant, Ranking

logger = logging.getLogger(__name__)


class DataAnalyzer:

    def __init__(self, db: Session):
        self.db = db

    def _valid_query(self, snapshot_id: int):
        return self.db.query(Restaurant).filter(
            Restaurant.snapshot_id == snapshot_id,
            Restaurant.is_valid == True,
        )

    # ------------------------------------------------------------------
    def overview(self, snapshot_id: int) -> dict:
        q = self._valid_query(snapshot_id)
        total = q.count()
        if total == 0:
            return dict(
                total=0, avg_rating=0, median_rating=0,
                max_rating=0, min_rating=0, avg_price=0,
                total_categories=0, total_districts=0, avg_reviews=0,
            )

        stats = self.db.query(
            func.avg(Restaurant.rating).label("avg_rating"),
            func.max(Restaurant.rating).label("max_rating"),
            func.min(Restaurant.rating).label("min_rating"),
            func.avg(Restaurant.cost_avg).label("avg_price"),
            func.avg(Restaurant.rating_count).label("avg_reviews"),
        ).filter(
            Restaurant.snapshot_id == snapshot_id,
            Restaurant.is_valid == True,
            Restaurant.rating > 0,
        ).first()

        categories = self.db.query(
            func.count(func.distinct(Restaurant.category))
        ).filter(
            Restaurant.snapshot_id == snapshot_id,
            Restaurant.is_valid == True,
            Restaurant.category.isnot(None),
        ).scalar() or 0

        districts = self.db.query(
            func.count(func.distinct(Restaurant.district))
        ).filter(
            Restaurant.snapshot_id == snapshot_id,
            Restaurant.is_valid == True,
            Restaurant.district.isnot(None),
            Restaurant.district != "",
        ).scalar() or 0

        # 中位数 (SQLite 无内置函数, 用 Python)
        all_ratings = sorted(
            [r.rating for r in q.filter(Restaurant.rating > 0).all()]
        )
        if all_ratings:
            mid = len(all_ratings) // 2
            median = (
                all_ratings[mid]
                if len(all_ratings) % 2 == 1
                else (all_ratings[mid - 1] + all_ratings[mid]) / 2
            )
        else:
            median = 0

        return {
            "total": total,
            "avg_rating": round(float(stats.avg_rating or 0), 2),
            "median_rating": round(median, 2),
            "max_rating": float(stats.max_rating or 0),
            "min_rating": float(stats.min_rating or 0),
            "avg_price": round(float(stats.avg_price or 0), 1),
            "total_categories": categories,
            "total_districts": districts,
            "avg_reviews": round(float(stats.avg_reviews or 0), 1),
        }

    # ------------------------------------------------------------------
    def category_stats(self, snapshot_id: int) -> list:
        results = (
            self.db.query(
                Restaurant.category,
                func.count(Restaurant.id).label("count"),
                func.avg(Restaurant.rating).label("avg_rating"),
                func.avg(Restaurant.cost_avg).label("avg_price"),
                func.max(Restaurant.rating).label("max_rating"),
                func.sum(Restaurant.rating_count).label("total_reviews"),
            )
            .filter(
                Restaurant.snapshot_id == snapshot_id,
                Restaurant.is_valid == True,
                Restaurant.category.isnot(None),
                Restaurant.rating > 0,
            )
            .group_by(Restaurant.category)
            .order_by(func.count(Restaurant.id).desc())
            .all()
        )
        return [
            {
                "category": r.category,
                "count": r.count,
                "avg_rating": round(float(r.avg_rating or 0), 2),
                "avg_price": round(float(r.avg_price or 0), 1),
                "max_rating": float(r.max_rating or 0),
                "total_reviews": int(r.total_reviews or 0),
            }
            for r in results
        ]

    # ------------------------------------------------------------------
    def district_stats(self, snapshot_id: int) -> list:
        results = (
            self.db.query(
                Restaurant.district,
                func.count(Restaurant.id).label("count"),
                func.avg(Restaurant.rating).label("avg_rating"),
                func.avg(Restaurant.cost_avg).label("avg_price"),
                func.max(Restaurant.rating).label("max_rating"),
            )
            .filter(
                Restaurant.snapshot_id == snapshot_id,
                Restaurant.is_valid == True,
                Restaurant.district.isnot(None),
                Restaurant.district != "",
                Restaurant.rating > 0,
            )
            .group_by(Restaurant.district)
            .order_by(func.count(Restaurant.id).desc())
            .all()
        )
        return [
            {
                "district": r.district,
                "count": r.count,
                "avg_rating": round(float(r.avg_rating or 0), 2),
                "avg_price": round(float(r.avg_price or 0), 1),
                "max_rating": float(r.max_rating or 0),
            }
            for r in results
        ]

    # ------------------------------------------------------------------
    def price_rating_scatter(self, snapshot_id: int) -> list:
        restaurants = (
            self._valid_query(snapshot_id)
            .filter(Restaurant.rating > 0, Restaurant.cost_avg > 0)
            .all()
        )
        return [
            {
                "id": r.id,
                "name": r.name,
                "category": r.category,
                "price": r.cost_avg,
                "rating": r.rating,
                "rating_count": r.rating_count,
            }
            for r in restaurants
        ]

    # ------------------------------------------------------------------
    def rating_distribution(self, snapshot_id: int, bin_size: float = 0.2) -> list:
        restaurants = (
            self._valid_query(snapshot_id)
            .filter(Restaurant.rating > 0)
            .all()
        )

        bins = {}
        current = 1.0
        while current < 5.0:
            upper = min(round(current + bin_size, 1), 5.0)
            label = f"{current:.1f}-{upper:.1f}"
            bins[label] = {"range": label, "min": current, "max": upper, "count": 0}
            current = upper

        for r in restaurants:
            for info in bins.values():
                in_range = (
                    info["min"] <= r.rating < info["max"]
                    or (info["max"] == 5.0 and r.rating == 5.0)
                )
                if in_range:
                    info["count"] += 1
                    break

        return [{"range": b["range"], "count": b["count"]} for b in bins.values()]

    # ------------------------------------------------------------------
    def heatmap_data(
        self,
        snapshot_id: int,
        algorithm: Optional[str] = None,
        top_percent: int = 100,
    ) -> list:
        if algorithm and top_percent < 100:
            total_ranked = (
                self.db.query(Ranking)
                .filter(
                    Ranking.snapshot_id == snapshot_id,
                    Ranking.algorithm == algorithm,
                )
                .count()
            )
            top_n = max(1, int(total_ranked * top_percent / 100))

            results = (
                self.db.query(Restaurant, Ranking)
                .join(Ranking, Restaurant.id == Ranking.restaurant_id)
                .filter(
                    Ranking.snapshot_id == snapshot_id,
                    Ranking.algorithm == algorithm,
                    Ranking.rank <= top_n,
                    Restaurant.is_valid == True,
                )
                .all()
            )
            return [
                {
                    "lat": r.latitude,
                    "lng": r.longitude,
                    "weight": rk.score,
                    "name": r.name,
                }
                for r, rk in results
            ]
        else:
            restaurants = (
                self._valid_query(snapshot_id)
                .filter(Restaurant.rating > 0)
                .all()
            )
            return [
                {
                    "lat": r.latitude,
                    "lng": r.longitude,
                    "weight": r.rating,
                    "name": r.name,
                }
                for r in restaurants
            ]