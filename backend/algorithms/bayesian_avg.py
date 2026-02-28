"""
贝叶斯平均排名算法

公式:  score = (v × R + m × C) / (v + m)

  R = 该餐厅评分
  v = 该餐厅评价数
  C = 所有餐厅平均评分（先验均值）
  m = 先验权重（默认取评价数中位数）

特点:
  - 评价数少的餐厅得分被拉向全局均值, 降低了"只有1条好评就拿满分"的偏差
  - 评价数越多, 得分越接近真实评分
"""
import statistics


class BayesianAverager:

    def calculate(self, restaurants: list, **params) -> list:
        if not restaurants:
            return []

        ratings = [r.get("rating", 0) or 0 for r in restaurants]
        counts = [r.get("rating_count", 0) or 0 for r in restaurants]

        # C: 全局平均评分
        C = sum(ratings) / len(ratings) if ratings else 0

        # m: 先验权重, 可外部传入, 默认用评价数中位数
        m = params.get("prior_weight", None)
        if m is None:
            valid_counts = [c for c in counts if c > 0]
            m = statistics.median(valid_counts) if valid_counts else 10

        for r in restaurants:
            v = r.get("rating_count", 0) or 0
            R = r.get("rating", 0) or 0
            if v + m > 0:
                r["score"] = round((v * R + m * C) / (v + m), 6)
            else:
                r["score"] = 0.0

        sorted_list = sorted(restaurants, key=lambda x: x["score"], reverse=True)

        for i, r in enumerate(sorted_list):
            r["rank"] = i + 1

        return sorted_list