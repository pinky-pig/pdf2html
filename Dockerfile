FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

COPY frontend/ ./
# Make sure build script runs in non-interactive mode
RUN CI=true pnpm build

# FROM python:3.11-slim
# WORKDIR /app
# # 安装基本依赖和 curl（用于与 pdf2htmlex 服务通信）
# RUN apt-get update && apt-get install -y \
#     gcc \
#     python3-dev \
#     libpq-dev \
#     curl \
#     && rm -rf /var/lib/apt/lists/*

FROM pdf2htmlex/pdf2htmlex:0.18.8.rc2-master-20200820-ubuntu-20.04-x86_64
ENTRYPOINT []
WORKDIR /app
# 安装 Python 和 pip
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

ENV IS_IN_DOCKER=true
# Install dependencies with retry mechanism
COPY backend/requirements.txt ./
RUN pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple || \
    pip install -r requirements.txt -i https://mirrors.aliyun.com/pypi/simple/ || \
    pip install -r requirements.txt

# Copy backend code
COPY backend/ /app/

# Create uploads directory and set permissions
RUN mkdir -p /app/uploads && chmod 777 /app/uploads

# Copy frontend build from the previous stage
COPY --from=frontend-builder /app/frontend/dist /app/static

# Set environment variables
ENV STATIC_DIR=/app/static
ENV UPLOADS_DIR=/app/uploads
ENV REDIS_URL=redis://redis:6379

EXPOSE 8000

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
