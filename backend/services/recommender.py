"""
隐藏宝藏发现与个性化推荐服务
"""
import logging
import statistics
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import and_

from models.restaurant import Restaurant, Ranking
from utils.geo import haversine_distance

logger = logging.getLogger(__name__)


class Recommender:

    def __init__(self, db: Session):
        self.db = db

    # ------------------------------------------------------------------
    def find_hidden_gems(
        self,
        snapshot_id: int,
        algorithm: str = "wilson",
        top_n: int = 50,
    ) -> list:
        """
        隐藏宝藏: 排名靠前但评价数少、知名度低的餐厅
        条件:
          1. 排名在前 30%
          2. 评价数低于中位数
          3. 评分 >= 全局平均
        """
        all_rankings = (
            self.db.query(Ranking)
            .filter(
                Ranking.snapshot_id == snapshot_id,
                Ranking.algorithm == algorithm,
            )
            .order_by(Ranking.rank.asc())
            .all()
        )
        if not all_rankings:
            return []

        total = len(all_rankings)
        top_30_rank = int(total * 0.3)

        # 预加载餐厅数据
        rest_map = {}
        all_counts = []
        all_ratings = []
        for rk in all_rankings:
            r = self.db.query(Restaurant).filter(Restaurant.id == rk.restaurant_id).first()
            if r:
                rest_map[rk.restaurant_id] = r
                all_counts.append(r.rating_count or 0)
                all_ratings.append(r.rating or 0)

        median_count = statistics.median(all_counts) if all_counts else 0
        avg_rating = statistics.mean(all_ratings) if all_ratings else 0

        gems = []
        for rk in all_rankings:
            if rk.rank > top_30_rank:
                break
            r = rest_map.get(rk.restaurant_id)
            if not r:
                continue
            if (r.rating_count or 0) >= median_count:
                continue
            if (r.rating or 0) < avg_rating:
                continue

            pct = int(rk.rank / total * 100)
            reason = (
                f"排名前{pct}%, "
                f"评价仅{r.rating_count}条(中位数{int(median_count)}), "
                f"评分{r.rating}(均值{avg_rating:.1f})"
            )
            gems.append({
                "restaurant_id": r.id,
                "name": r.name,
                "category": r.category,
                "rating": r.rating,
                "rating_count": r.rating_count,
                "cost_avg": r.cost_avg,
                "rank": rk.rank,
                "score": round(rk.score, 4),
                "district": r.district,
                "latitude": r.latitude,
                "longitude": r.longitude,
                "address": r.address,
                "reason": reason,
            })
            if len(gems) >= top_n:
                break

        return gems

    # ------------------------------------------------------------------
    def personalized_recommend(
        self,
        snapshot_id: int,
        algorithm: str = "wilson",
        categories: Optional[List[str]] = None,
        max_price: Optional[float] = None,
        center_lat: Optional[float] = None,
        center_lng: Optional[float] = None,
        radius_km: Optional[float] = None,
        top_n: int = 20,
    ) -> list:
        query = (
            self.db.query(Restaurant, Ranking)
            .join(
                Ranking,
                and_(
                    Restaurant.id == Ranking.restaurant_id,
                    Ranking.algorithm == algorithm,
                    Ranking.snapshot_id == snapshot_id,
                ),
            )
            .filter(
                Restaurant.snapshot_id == snapshot_id,
                Restaurant.is_valid == True,
            )
        )

        if categories:
            query = query.filter(Restaurant.category.in_(categories))
        if max_price is not None:
            query = query.filter(Restaurant.cost_avg <= max_price)

        results = query.order_by(Ranking.rank.asc()).limit(top_n * 3).all()

        items = []
        for r, rk in results:
            if center_lat and center_lng and radius_km:
                dist = haversine_distance(center_lat, center_lng, r.latitude, r.longitude)
                if dist > radius_km:
                    continue

            items.append({
                "restaurant_id": r.id,
                "name": r.name,
                "category": r.category,
                "rating": r.rating,
                "rating_count": r.rating_count,
                "cost_avg": r.cost_avg,
                "rank": rk.rank,
                "score": round(rk.score, 4),
                "district": r.district,
                "latitude": r.latitude,
                "longitude": r.longitude,
                "address": r.address,
            })
            if len(items) >= top_n:
                break

        return items