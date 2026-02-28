"""
城市餐厅智能排名分析系统 — 后端入口
启动: python main.py  或  uvicorn main:app --reload
"""
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db
from api import collection, restaurants, ranking, analysis, export

# 日志配置
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

app = FastAPI(
    title="城市餐厅智能排名分析系统",
    description="基于高德地图 POI 数据, 多维度排名与分析城市餐厅",
    version="1.0.0",
)

# CORS (开发阶段允许所有来源)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(collection.router)
app.include_router(restaurants.router)
app.include_router(ranking.router)
app.include_router(analysis.router)
app.include_router(export.router)


@app.on_event("startup")
def on_startup():
    """应用启动时自动建表"""
    init_db()
    logging.info("数据库初始化完成")


@app.get("/", tags=["根"])
def root():
    return {
        "name": "城市餐厅智能排名分析系统",
        "version": "1.0.0",
        "api_docs": "/docs",
        "redoc": "/redoc",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)