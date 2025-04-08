from fastapi import APIRouter, UploadFile, File, HTTPException
import os
from pathlib import Path
import shutil

router = APIRouter(
    prefix="/upload",  # 添加 /upload 前缀
    tags=["upload"]
)

# 获取项目根目录
BASE_DIR = Path(__file__).parent.parent.parent

# 从环境变量获取上传目录，默认使用相对路径
UPLOADS_DIR = os.environ.get("UPLOADS_DIR", str(BASE_DIR / "uploads"))
uploads_path = Path(UPLOADS_DIR)
uploads_path.mkdir(parents=True, exist_ok=True)

@router.post("/file")
async def upload_file(file: UploadFile = File(...)):
    """
    上传文件到 public 目录
    """
    try:
        # 生成唯一文件名避免覆盖
        filename = f"{os.urandom(8).hex()}_{file.filename}"
        file_path = uploads_path / filename
        
        # 保存文件
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # 返回可访问的URL
        return {
            "filename": filename,
            "original_filename": file.filename,
            "url": f"/uploads/{filename}",  # 客户端访问路径
            "content_type": file.content_type,
            "success": True
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
