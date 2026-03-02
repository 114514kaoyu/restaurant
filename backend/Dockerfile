# ============ 后端 Dockerfile ============
FROM python:3.11-slim

WORKDIR /app

# 安装依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple

# 复制源代码
COPY . .

# 创建数据目录（用于 SQLite 持久化）
RUN mkdir -p /data

# 设置环境变量：数据库文件放在 /data 目录下（方便挂载持久化卷）
ENV DATABASE_URL=sqlite:////data/restaurant_ranking.db

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
