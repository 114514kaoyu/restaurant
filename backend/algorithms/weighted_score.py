"""
加权综合评分算法

将多个维度归一化后加权求和:
  1. 评分维度   — 原始评分 Min-Max 归一化
  2. 人气维度   — 评价数对数归一化
  3. 性价比维度 — 评分/价格归一化

默认权重: 评分 0.5, 人气 0.3, 性价比 0.2
权重可由用户自定义传入
"""
import math


class WeightedScorer:

    DEFAULT_WEIGHTS = {
        "rating": 0.5,
        "popularity": 0.3,
        "value": 0.2,
    }

    @staticmethod
    def _normalize(values: list) -> list:
        """Min-Max 归一化到 [0, 1]"""
        if not values:
            return values
        min_v = min(values)
        max_v = max(values)
        if max_v == min_v:
            return [0.5] * len(values)
        return [(v - min_v) / (max_v - min_v) for v in values]

    def calculate(self, restaurants: list, **params) -> list:
        if not restaurants:
            return []

        weights = params.get("weights", self.DEFAULT_WEIGHTS)
        w_r = weights.get("rating", 0.5)
        w_p = weights.get("popularity", 0.3)
        w_v = weights.get("value", 0.2)

        # 归一化权重总和为 1
        total_w = w_r + w_p + w_v
        if total_w == 0:
            total_w = 1.0
        w_r /= total_w
        w_p /= total_w
        w_v /= total_w

        # 提取原始值
        raw_ratings = []
        raw_popularity = []
        raw_value = []

        for r in restaurants:
            rating = r.get("rating", 0) or 0
            count = r.get("rating_count", 0) or 0
            cost = r.get("cost_avg", 0) or 0

            raw_ratings.append(rating)
            raw_popularity.append(math.log(count + 1))        # 对数平滑
            raw_value.append(rating / cost if cost > 0 else 0)

        # 归一化
        norm_r = self._normalize(raw_ratings)
        norm_p = self._normalize(raw_popularity)
        norm_v = self._normalize(raw_value)

        # 加权求和, 映射到 1-5 分制
        for i, r in enumerate(restaurants):
            score = w_r * norm_r[i] + w_p * norm_p[i] + w_v * norm_v[i]
            r["score"] = round(score * 4.0 + 1.0, 6)

        sorted_list = sorted(restaurants, key=lambda x: x["score"], reverse=True)

        for i, r in enumerate(sorted_list):
            r["rank"] = i + 1

        return sorted_list