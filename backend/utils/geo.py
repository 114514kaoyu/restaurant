"""
地理计算工具
将大范围搜索区域拆分为小圆网格, 以突破高德 POI 搜索的数量上限
"""
import math
from typing import List, Tuple

EARTH_RADIUS_KM = 6371.0


def haversine_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Haversine 公式: 计算两坐标点间的球面距离 (km)"""
    lat1, lng1, lat2, lng2 = map(math.radians, [lat1, lng1, lat2, lng2])
    dlat = lat2 - lat1
    dlng = lng2 - lng1
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlng / 2) ** 2
    return EARTH_RADIUS_KM * 2 * math.asin(math.sqrt(a))


def km_to_lat_offset(km: float) -> float:
    """公里 → 纬度偏移 (近似)"""
    return km / 111.32


def km_to_lng_offset(km: float, lat: float) -> float:
    """公里 → 经度偏移 (与纬度有关)"""
    return km / (111.32 * math.cos(math.radians(lat)))


def generate_grid_centers(
    center_lat: float,
    center_lng: float,
    radius_km: float,
    step_km: float = 1.0,
) -> List[Tuple[float, float, int]]:
    """
    在目标圆形区域内生成均匀网格中心点

    参数:
        center_lat, center_lng: 圆心坐标
        radius_km:              搜索总半径 (km)
        step_km:                网格步长 (km)

    返回:
        [(lat, lng, search_radius_meters), ...]
    """
    # 搜索半径: step × √2 / 2 + 冗余, 确保正方形网格被圆搜索全覆盖
    search_radius_m = int(step_km * 1000 * math.sqrt(2) / 2) + 50
    search_radius_m = min(search_radius_m, 50000)  # 高德最大 50km

    lat_step = km_to_lat_offset(step_km)
    lng_step = km_to_lng_offset(step_km, center_lat)

    grid_points: List[Tuple[float, float, int]] = []
    n = int(math.ceil(radius_km / step_km))

    for i in range(-n, n + 1):
        for j in range(-n, n + 1):
            lat = center_lat + i * lat_step
            lng = center_lng + j * lng_step
            dist = haversine_distance(center_lat, center_lng, lat, lng)
            if dist <= radius_km + step_km:
                grid_points.append((lat, lng, search_radius_m))

    return grid_points