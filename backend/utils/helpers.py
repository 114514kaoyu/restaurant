"""通用工具函数"""
from difflib import SequenceMatcher


def string_similarity(a: str, b: str) -> float:
    """计算两个字符串的相似度 (0-1)"""
    if not a or not b:
        return 0.0
    return SequenceMatcher(None, a, b).ratio()


def parse_amap_type(type_str: str) -> tuple:
    """
    解析高德 POI 类型字符串
    输入: "餐饮服务;中餐厅;火锅店"
    输出: ("中餐厅", "火锅店")
    """
    if not type_str:
        return (None, None)
    parts = type_str.split(";")
    category = parts[1].strip() if len(parts) > 1 else parts[0].strip()
    sub_category = parts[2].strip() if len(parts) > 2 else None
    return (category, sub_category)


def parse_amap_location(location_str: str) -> tuple:
    """
    解析高德经纬度字符串
    输入: "104.081,30.657"  (经度,纬度)
    输出: (30.657, 104.081) (纬度, 经度)
    """
    if not location_str:
        return (0.0, 0.0)
    parts = location_str.split(",")
    if len(parts) != 2:
        return (0.0, 0.0)
    try:
        lng = float(parts[0].strip())
        lat = float(parts[1].strip())
        return (lat, lng)
    except (ValueError, TypeError):
        return (0.0, 0.0)


def safe_float(value, default=None):
    """安全转换为 float"""
    if value is None or value == "" or value == "[]":
        return default
    try:
        return float(value)
    except (ValueError, TypeError):
        return default


def safe_int(value, default=0):
    """安全转换为 int"""
    if value is None or value == "" or value == "[]":
        return default
    try:
        return int(float(value))
    except (ValueError, TypeError):
        return default