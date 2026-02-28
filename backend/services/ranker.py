"""
排名计算服务
调用 algorithms 包中的不同算法对餐厅进行排名, 并将结果持久化
"""
import logging
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_

from models.restaurant import Restaurant, Ranking
from algorithms import ALGORITHM_MAP

logger = logging.getLogger(__name__)


class RankingService:

    def __init__(self, db: Session):
        self.db = db

    # ------------------------------------------------------------------
    # 计算排名
    # ------------------------------------------------------------------
    def calculate_ranking(
        self,
        snapshot_id: int,
        algorithm: str = "wilson",
        confidence: float = 0.99,
        weights: Optional[dict] = None,
        filters: Optional[dict] = None,
    ) -> int:
        """计算并存储排名, 返回参与排名的餐厅数"""
        if algorithm not in ALGORITHM_MAP:
            raise ValueError(
                f"不支持的算法: {algorithm}, 可选: {list(ALGORITHM_MAP.keys())}"
            )

        # 查询有效餐厅
        query = self.db.query(Restaurant).filter(
            Restaurant.snapshot_id == snapshot_id,
            Restaurant.is_valid == True,
        )

        if filters:
            if filters.get("min_reviews"):
                query = query.filter(
                    Restaurant.rating_count >= filters["min_reviews"]
                )
            if filters.get("category"):
                query = query.filter(Restaurant.category == filters["category"])
            if filters.get("district"):
                query = query.filter(Restaurant.district == filters["district"])

        restaurants = query.all()
        if not restaurants:
            logger.warning(f"快照 {snapshot_id} 没有符合条件的餐厅")
            return 0

        # 转为字典列表
        restaurant_dicts = [
            {
                "id": r.id,
                "name": r.name,
                "rating": r.rating or 0,
                "rating_count": r.rating_count or 0,
                "cost_avg": r.cost_avg or 0,
                "category": r.category,
                "district": r.district,
            }
            for r in restaurants
        ]

        # 调用算法
        ranker_cls = ALGORITHM_MAP[algorithm]
        ranker = ranker_cls()
        params = {"confidence": confidence}
        if weights:
            params["weights"] = weights
        ranked_list = ranker.calculate(restaurant_dicts, **params)

        # 清除旧排名
        self.db.query(Ranking).filter(
            Ranking.snapshot_id == snapshot_id,
            Ranking.algorithm == algorithm,
        ).delete()
        self.db.commit()

        # 批量写入
        now = datetime.now()
        batch = [
            Ranking(
                restaurant_id=item["id"],
                snapshot_id=snapshot_id,
                algorithm=algorithm,
                score=item["score"],
                rank=item["rank"],
                confidence=item.get("confidence"),
                calculated_at=now,
            )
            for item in ranked_list
        ]
        self.db.add_all(batch)
        self.db.commit()

        logger.info(
            f"排名计算完成: 快照{snapshot_id}, "
            f"算法={algorithm}, 共{len(ranked_list)}家"
        )
        return len(ranked_list)

    # ------------------------------------------------------------------
    # 查询排名列表
    # ------------------------------------------------------------------
    def get_ranking_list(
        self,
        snapshot_id: int,
        algorithm: str = "wilson",
        page: int = 1,
        page_size: int = 20,
        category: Optional[str] = None,
        district: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        keyword: Optional[str] = None,
    ) -> dict:
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

        if category:
            query = query.filter(Restaurant.category == category)
        if district:
            query = query.filter(Restaurant.district == district)
        if min_price is not None:
            query = query.filter(Restaurant.cost_avg >= min_price)
        if max_price is not None:
            query = query.filter(Restaurant.cost_avg <= max_price)
        if keyword:
            query = query.filter(Restaurant.name.contains(keyword))

        total = query.count()
        results = (
            query.order_by(Ranking.rank.asc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )

        items = [
            {
                "id": r.id,
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
                "rank": rk.rank,
                "score": rk.score,
                "algorithm": rk.algorithm,
            }
            for r, rk in results
        ]

        return {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size,
        }

    # ------------------------------------------------------------------
    # 多算法对比
    # ------------------------------------------------------------------
    def compare_algorithms(self, snapshot_id: int, top_n: int = 20) -> list:
        algorithms = ["naive", "bayesian", "wilson", "weighted"]
        all_rankings: dict = {}

        for algo in algorithms:
            rankings = (
                self.db.query(Ranking)
                .filter(
                    Ranking.snapshot_id == snapshot_id,
                    Ranking.algorithm == algo,
                    Ranking.rank <= top_n,
                )
                .all()
            )
            for rk in rankings:
                if rk.restaurant_id not in all_rankings:
                    rest = self.db.query(Restaurant).filter(
                        Restaurant.id == rk.restaurant_id
                    ).first()
                    all_rankings[rk.restaurant_id] = {
                        "restaurant_id": rk.restaurant_id,
                        "restaurant_name": rest.name if rest else "未知",
                        "rankings": {},
                    }
                all_rankings[rk.restaurant_id]["rankings"][algo] = {
                    "rank": rk.rank,
                    "score": round(rk.score, 4),
                }

        return list(all_rankings.values())