FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

COPY frontend/ ./
# Make sure build script runs in non-interactive mode
RUN CI=true pnpm build

FROM python:3.11-alpine

WORKDIR /app

# 安装基本依赖
RUN apk add --no-cache \
    fontconfig \
    glib \
    libxcb \
    libx11 \
    fuse \
    gcc \
    python3-dev \
    postgresql-dev \
    musl-dev \
    libstdc++ \
    libgcc \
    linux-headers \
    && pip install --no-cache-dir -U pip setuptools wheel

# 复制并安装 pdf2htmlEX
COPY backend/pdf2htmlEX-0.18.8.rc1-master-20200630-alpine-3.12.0-x86_64.tar.gz /tmp/
RUN tar xzf /tmp/pdf2htmlEX-0.18.8.rc1-master-20200630-alpine-3.12.0-x86_64.tar.gz -C / && \
    rm -f /tmp/pdf2htmlEX-0.18.8.rc1-master-20200630-alpine-3.12.0-x86_64.tar.gz && \
    # 确保所有必要的库都存在
    ln -sf /usr/lib/libstdc++.so.6 /usr/local/lib/libstdc++.so.6 && \
    ln -sf /usr/lib/libgcc_s.so.1 /usr/local/lib/libgcc_s.so.1

# Install dependencies with retry mechanism
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple || \
    pip install --no-cache-dir -r requirements.txt -i https://mirrors.aliyun.com/pypi/simple/ || \
    pip install --no-cache-dir -r requirements.txt

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
