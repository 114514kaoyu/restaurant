"""
朴素排序算法
直接按评分降序排列，评分相同按评价数量降序。
最简单的基线算法，不做任何修正。
"""


class NaiveSorter:

    def calculate(self, restaurants: list, **params) -> list:
        """
        参数:
            restaurants: 餐厅字典列表, 每项至少含 id, rating, rating_count
        返回:
            添加了 score / rank 字段的列表, 按 rank 升序排列
        """
        for r in restaurants:
            r["score"] = r.get("rating", 0) or 0

        sorted_list = sorted(
            restaurants,
            key=lambda x: (x["score"], x.get("rating_count", 0) or 0),
            reverse=True,
        )

        for i, r in enumerate(sorted_list):
            r["rank"] = i + 1

        return sorted_list