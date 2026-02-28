"""报告导出接口"""
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from database import get_db
from services.reporter import ReportService

router = APIRouter(prefix="/api/export", tags=["导出"])


@router.get("/excel/{snapshot_id}")
def export_excel(
    snapshot_id: int,
    algorithm: str = Query("wilson"),
    db: Session = Depends(get_db),
):
    """导出排名报告为 Excel 文件"""
    service = ReportService(db)
    output = service.export_excel(snapshot_id, algorithm)

    filename = f"restaurant_ranking_{snapshot_id}.xlsx"
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )