"""
排名算法注册表
通过 ALGORITHM_MAP 字典统一管理所有算法
"""
from algorithms.naive_sort import NaiveSorter
from algorithms.bayesian_avg import BayesianAverager
from algorithms.wilson_score import WilsonScorer
from algorithms.weighted_score import WeightedScorer

ALGORITHM_MAP = {
    "naive": NaiveSorter,
    "bayesian": BayesianAverager,
    "wilson": WilsonScorer,
    "weighted": WeightedScorer,
}

ALGORITHM_NAMES = {
    "naive": "朴素排序",
    "bayesian": "贝叶斯平均",
    "wilson": "Wilson评分区间",
    "weighted": "加权综合评分",
}