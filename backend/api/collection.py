"""
城市管理 + 数据采集 + 数据清洗 接口
"""
import logging
import threading
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from database import get_db, SessionLocal
from models.restaurant import City, Snapshot
from schemas.city import CityCreate
from services.collector import RestaurantCollector
from services.cleaner import DataCleaner

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["城市与采集"])


# ======================== 城市管理 ========================

@router.get("/cities")
def list_cities(db: Session = Depends(get_db)):
    """获取已有城市列表"""
    cities = db.query(City).order_by(City.created_at.desc()).all()
    result = []
    for c in cities:
        latest = (
            db.query(Snapshot)
            .filter(Snapshot.city_id == c.id)
            .order_by(Snapshot.collected_at.desc())
            .first()
        )
        snap_count = db.query(Snapshot).filter(Snapshot.city_id == c.id).count()
        result.append({
            "id": c.id,
            "name": c.name,
            "province": c.province,
            "center_lat": c.center_lat,
            "center_lng": c.center_lng,
            "radius_km": c.radius_km,
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "snapshot_count": snap_count,
            "latest_snapshot": {
                "id": latest.id,
                "collected_at": latest.collected_at.isoformat() if latest.collected_at else None,
                "total_count": latest.total_count,
                "status": latest.status,
            } if latest else None,
        })
    return result


@router.post("/cities")
def create_city(data: CityCreate, db: Session = Depends(get_db)):
    """新增城市"""
    city = City(
        name=data.name,
        province=data.province,
        center_lat=data.center_lat,
        center_lng=data.center_lng,
        radius_km=data.radius_km,
    )
    db.add(city)
    db.commit()
    db.refresh(city)
    return {"id": city.id, "message": f"城市 '{city.name}' 已添加"}


@router.delete("/cities/{city_id}")
def delete_city(city_id: int, db: Session = Depends(get_db)):
    """删除城市及其所有数据"""
    city = db.query(City).filter(City.id == city_id).first()
    if not city:
        raise HTTPException(status_code=404, detail="城市不存在")
    name = city.name
    db.delete(city)
    db.commit()
    return {"message": f"城市 '{name}' 及其所有数据已删除"}


# ======================== 数据采集 ========================

@router.post("/collection/start")
def start_collection(
    city_id: int = Query(...),
    step_km: float = Query(1.0, ge=0.3, le=5.0),
    db: Session = Depends(get_db),
):
    """启动数据采集 (后台线程异步执行)"""
    city = db.query(City).filter(City.id == city_id).first()
    if not city:
        raise HTTPException(status_code=404, detail="城市不存在")

    # 创建快照
    snapshot = Snapshot(city_id=city.id, status="pending", note=f"step={step_km}km")
    db.add(snapshot)
    db.commit()
    db.refresh(snapshot)
    snapshot_id = snapshot.id

    # 后台线程
    def _run():
        thread_db = SessionLocal()
        try:
            collector = RestaurantCollector(thread_db)
            collector.collect(city_id, snapshot_id, step_km)
        except Exception as e:
            logger.error(f"采集线程异常: {e}")
            snap = thread_db.query(Snapshot).filter(Snapshot.id == snapshot_id).first()
            if snap and snap.status != "completed":
                snap.status = "failed"
                snap.note = str(e)
                thread_db.commit()
        finally:
            thread_db.close()

    threading.Thread(target=_run, daemon=True).start()

    return {
        "snapshot_id": snapshot_id,
        "message": f"采集任务已启动 — 城市: {city.name}, 步长: {step_km}km",
    }


@router.get("/collection/status/{snapshot_id}")
def get_collection_status(snapshot_id: int, db: Session = Depends(get_db)):
    """查询采集进度"""
    snapshot = db.query(Snapshot).filter(Snapshot.id == snapshot_id).first()
    if not snapshot:
        raise HTTPException(status_code=404, detail="快照不存在")

    progress = RestaurantCollector.get_progress(snapshot_id)
    return {
        "snapshot_id": snapshot_id,
        "status": snapshot.status,
        "total_count": snapshot.total_count,
        "progress": progress,
    }


# ======================== 数据清洗 ========================

@router.post("/collection/clean/{snapshot_id}")
def clean_data(snapshot_id: int, db: Session = Depends(get_db)):
    """对指定快照执行自动清洗"""
    snapshot = db.query(Snapshot).filter(Snapshot.id == snapshot_id).first()
    if not snapshot:
        raise HTTPException(status_code=404, detail="快照不存在")
    if snapshot.status != "completed":
        raise HTTPException(status_code=400, detail="快照尚未采集完成, 无法清洗")

    cleaner = DataCleaner(db)
    report = cleaner.auto_clean(snapshot_id)
    return report.model_dump()