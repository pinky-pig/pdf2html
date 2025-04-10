import os
import subprocess
import requests
from pathlib import Path
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, AnyHttpUrl
from urllib.parse import urlparse
import shutil
from ..models.task import TaskStatus
from fastapi_utils.tasks import repeat_every
from ..utils.redis_manager import redis_manager
import time
from concurrent.futures import ThreadPoolExecutor
import asyncio
from functools import partial

from pathlib import Path
from urllib.parse import urlparse
from urllib.parse import unquote

router = APIRouter(
    prefix="/transform",
    tags=["transform"],
    responses={404: {"description": "Not found"}},
)

# 获取项目根目录
BASE_DIR = Path(__file__).parent.parent.parent

# 设置上传目录和转换目录
UPLOADS_DIR = os.environ.get("UPLOADS_DIR", str(BASE_DIR / "uploads"))
CONVERTS_DIR = Path(UPLOADS_DIR) / "converts"
CONVERTS_DIR.mkdir(parents=True, exist_ok=True)
class PDFRequest(BaseModel):
    pdf_url: AnyHttpUrl

# 创建线程池
executor = ThreadPoolExecutor(max_workers=3)  # 可以根据需要调整线程数

async def process_pdf_background(task_id: str, pdf_url: str, work_dir: str):
    """
    后台处理PDF转换
    """
    try:
        # 更新状态为处理中
        await redis_manager.update_task_status(task_id, TaskStatus.PROCESSING) # type: ignore
        
        # 在线程池中执行耗时的文件处理
        loop = asyncio.get_running_loop()
        # 将同步的处理函数放到线程池中执行
        success, result = await loop.run_in_executor(
            executor,
            partial(process_pdf_url, pdf_url, work_dir)
        )
        
        if success:
            # 更新状态为完成
            await redis_manager.update_task_status(
                task_id,
                TaskStatus.COMPLETED, # type: ignore
                result=f"/uploads/converts/{os.path.basename(result)}"
            )
        else:
            # 更新状态为失败
            await redis_manager.update_task_status(
                task_id,
                TaskStatus.FAILED, # type: ignore
                error=result
            )
            
    except Exception as e:
        # 发生异常时更新状态
        await redis_manager.update_task_status(
            task_id,
            TaskStatus.FAILED, # type: ignore
            error=str(e)
        )

@router.post("/convert")
async def convert_pdf(request: PDFRequest, background_tasks: BackgroundTasks):
    """
    启动PDF转换任务
    """
    task_id = os.urandom(8).hex()
    
    # 创建任务记录
    task_data = {
        "task_id": task_id,
        "status": TaskStatus.PENDING,
        "created_at": time.time(),
        "updated_at": time.time(),
        "pdf_url": str(request.pdf_url),
        "result": None,
        "error": None
    }
    
    # 保存到Redis
    await redis_manager.set_task(task_id, task_data)
    
    # 在后台启动转换任务
    background_tasks.add_task(
        process_pdf_background,
        task_id,
        str(request.pdf_url),
        str(CONVERTS_DIR)
    )
    
    return {
        "task_id": task_id,
        "status": TaskStatus.PENDING
    }

@router.get("/task/{task_id}")
async def get_task_status(task_id: str):
    """
    获取任务状态
    """
    try:
        task = await redis_manager.get_task(task_id)
        if not task:
            raise HTTPException(status_code=404, detail="任务不存在")
        return task
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取任务状态失败: {str(e)}")

# 定期清理旧任务
@router.on_event("startup") # type: ignore
@repeat_every(seconds=3600)
async def cleanup_old_tasks():
    await redis_manager.cleanup_old_tasks()

def download_pdf(url: str, save_path: str) -> bool:
    """
    从URL下载PDF文件
    """
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/pdf'
        }
        
        # 添加超时设置
        response = requests.get(
            url, 
            headers=headers, 
            timeout=30,  # 设置30秒超时
            stream=True  # 使用流式下载
        )
        response.raise_for_status()
        
        # 使用流式写入
        with open(save_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
        return True
        
    except requests.exceptions.Timeout:
        print("下载超时")
        return False
    except requests.exceptions.RequestException as e:
        print(f"下载PDF时出错: {str(e)}")
        return False
    except Exception as e:
        print(f"其他错误: {str(e)}")
        return False

def convert_pdf_to_html(pdf_path: str, output_dir: str) -> tuple[bool, str]:
    """
    使用pdf2htmlEX将PDF转换为HTML
    """
    try:
        # 确保输出目录存在
        Path(output_dir).mkdir(parents=True, exist_ok=True)
        
        # 生成唯一的输出文件名
        pdf_name = f"{os.path.splitext(os.path.basename(pdf_path))[0]}"
        output_html = os.path.join(output_dir, f"{pdf_name}.html")
        
        # 构建docker命令
        cmd = [
            "docker", "run", "-ti", "--rm",
            "--mount", f"src={os.path.dirname(os.path.abspath(pdf_path))},target=/pdf,type=bind",
            "pdf2htmlex/pdf2htmlex:0.18.8.rc2-master-20200820-ubuntu-20.04-x86_64",
            "--zoom", "1.3",
            "--process-outline", "0",
            f"/pdf/{os.path.basename(pdf_path)}",
        ]
        
        # 执行转换命令
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            return True, output_html
        else:
            return False, f"转换失败: {result.stderr}"
            
    except Exception as e:
        return False, f"转换过程出错: {str(e)}"

def process_pdf_url(pdf_url: str, work_dir: str) -> tuple[bool, str]:
    """
    处理PDF URL：下载并转换为HTML
    """
    try:
        work_dir_path = Path(work_dir)
        work_dir_path.mkdir(parents=True, exist_ok=True)

        # 创建临时PDF文件名
        temp_pdf = Path(pdf_url).stem + ".pdf"
        pdf_path = work_dir_path / temp_pdf

        # 解析 URL
        parsed_url = urlparse(pdf_url)

        # 检查是否是本地 uvicorn 服务的文件
        if parsed_url.netloc in ['localhost:8090', '127.0.0.1:8090']:
            try:
                url_path = unquote(parsed_url.path)
                if url_path.startswith('/uploads/'):
                    # 构建源文件的实际路径
                    relative_path = url_path.replace('/uploads/', '')
                    source_path = Path(UPLOADS_DIR) / relative_path

                    if not source_path.exists():
                        return False, f"文件不存在: {source_path}"

                    shutil.copy2(source_path, pdf_path)
                    print(f"本地文件复制成功: {source_path} -> {pdf_path}")
                else:
                    return False, "无效的文件路径"

            except Exception as e:
                return False, f"本地文件处理失败: {str(e)}"
        else:
            # 对于其他URL，使用 requests 下载
            success = download_pdf(pdf_url, str(pdf_path))
            if not success:
                return False, "PDF下载失败"

        # 转换为HTML
        success, result = convert_pdf_to_html(str(pdf_path), str(work_dir_path))

        # 清理临时PDF文件
        try:
            pdf_path.unlink()
        except:
            pass

        return success, result

    except Exception as e:
        return False, f"处理失败: {str(e)}"