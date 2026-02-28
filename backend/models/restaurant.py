"""
ORM 数据模型
包含：城市表、数据快照表、餐厅表、排名结果表
"""
from datetime import datetime
from typing import Optional, List

from sqlalchemy import Integer, String, Float, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class City(Base):
    """城市表"""
    __tablename__ = "cities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False, comment="城市名")
    province: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, comment="省份")
    center_lat: Mapped[float] = mapped_column(Float, nullable=False, comment="中心纬度")
    center_lng: Mapped[float] = mapped_column(Float, nullable=False, comment="中心经度")
    radius_km: Mapped[float] = mapped_column(Float, default=15.0, comment="搜索半径km")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

    snapshots: Mapped[List["Snapshot"]] = relationship(
        back_populates="city", cascade="all, delete-orphan"
    )


class Snapshot(Base):
    """数据采集快照表：每次采集生成一条"""
    __tablename__ = "snapshots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    city_id: Mapped[int] = mapped_column(Integer, ForeignKey("cities.id"), nullable=False)
    collected_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    total_count: Mapped[int] = mapped_column(Integer, default=0, comment="餐厅总数")
    status: Mapped[str] = mapped_column(
        String(20), default="pending", comment="pending/collecting/completed/failed"
    )
    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True, comment="备注")

    city: Mapped["City"] = relationship(back_populates="snapshots")
    restaurants: Mapped[List["Restaurant"]] = relationship(
        back_populates="snapshot", cascade="all, delete-orphan"
    )
    rankings: Mapped[List["Ranking"]] = relationship(
        back_populates="snapshot", cascade="all, delete-orphan"
    )


class Restaurant(Base):
    """餐厅表"""
    __tablename__ = "restaurants"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    snapshot_id: Mapped[int] = mapped_column(Integer, ForeignKey("snapshots.id"), nullable=False)
    poi_id: Mapped[str] = mapped_column(String(50), nullable=False, comment="高德POI ID")
    name: Mapped[str] = mapped_column(String(200), nullable=False, comment="餐厅名称")
    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, comment="菜系分类")
    sub_category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, comment="子分类")
    rating: Mapped[Optional[float]] = mapped_column(Float, nullable=True, comment="综合评分0-5")
    rating_count: Mapped[int] = mapped_column(Integer, default=0, comment="评价数量")
    cost_avg: Mapped[Optional[float]] = mapped_column(Float, nullable=True, comment="人均消费元")
    latitude: Mapped[float] = mapped_column(Float, nullable=False, comment="纬度")
    longitude: Mapped[float] = mapped_column(Float, nullable=False, comment="经度")
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True, comment="地址")
    district: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, comment="区域/商圈")
    tel: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, comment="电话")
    business_hours: Mapped[Optional[str]] = mapped_column(Text, nullable=True, comment="营业时间")
    is_valid: Mapped[bool] = mapped_column(Boolean, default=True, comment="清洗后是否有效")
    invalid_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True, comment="无效原因")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

    snapshot: Mapped["Snapshot"] = relationship(back_populates="restaurants")
    rankings: Mapped[List["Ranking"]] = relationship(
        back_populates="restaurant", cascade="all, delete-orphan"
    )


class Ranking(Base):
    """排名结果表：每个算法对每个餐厅产生一条记录"""
    __tablename__ = "rankings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    restaurant_id: Mapped[int] = mapped_column(Integer, ForeignKey("restaurants.id"), nullable=False)
    snapshot_id: Mapped[int] = mapped_column(Integer, ForeignKey("snapshots.id"), nullable=False)
    algorithm: Mapped[str] = mapped_column(
        String(30), nullable=False, comment="naive/bayesian/wilson/weighted"
    )
    score: Mapped[float] = mapped_column(Float, nullable=False, comment="算法得分")
    rank: Mapped[int] = mapped_column(Integer, nullable=False, comment="排名名次")
    confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True, comment="置信度参数")
    calculated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

    restaurant: Mapped["Restaurant"] = relationship(back_populates="rankings")
    snapshot: Mapped["Snapshot"] = relationship(back_populates="rankings")