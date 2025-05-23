from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .routers import transform, upload
import os
from pathlib import Path
from .utils.redis_manager import redis_manager

app = FastAPI(title="PDF2HTML API", description="A PDF to HTML converter service API")

# 获取项目根目录
BASE_DIR = Path(__file__).parent.parent

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 先导入路由，确保 API 优先级高于静态文件
app.include_router(transform.router, prefix="/api")
app.include_router(upload.router, prefix="/api")

# 从环境变量获取目录路径，默认使用相对路径
STATIC_DIR = os.environ.get("STATIC_DIR", str(BASE_DIR / "static"))
if os.path.exists(STATIC_DIR):
    app.mount("/assets", StaticFiles(directory=f"{STATIC_DIR}/assets"), name="static")

# 挂载上传文件目录
UPLOADS_DIR = os.environ.get("UPLOADS_DIR", str(BASE_DIR / "uploads"))
Path(UPLOADS_DIR).mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

# 挂载静态文件目录 (必须放在其它路由之后)
if Path(STATIC_DIR).exists():
    app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")

# task_redis启动
@app.on_event("startup") # type: ignore
async def startup_event():
    # Redis 连接已在 RedisManager 初始化时建立
    pass

# task_redis关闭
@app.on_event("shutdown") # type: ignore
async def shutdown_event():
    # 关闭 Redis 连接
    await redis_manager.redis.close()


