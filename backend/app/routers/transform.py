import os
import subprocess
import requests
from pathlib import Path
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, HttpUrl, AnyHttpUrl
from urllib.parse import urlparse
import shutil
from ..task_manager import task_manager
from ..models.task import TaskStatus
from fastapi_utils.tasks import repeat_every

router = APIRouter(
    prefix="/api/transform",
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

async def process_pdf_task(task_id: str, pdf_url: str, work_dir: str):
    """异步处理PDF转换任务"""
    try:
        task_manager.update_task(task_id, TaskStatus.PROCESSING)
        
        # 执行转换
        success, result = process_pdf_url(pdf_url, work_dir)
        
        if success:
            # 成功后更新任务状态
            task_manager.update_task(
                task_id, 
                TaskStatus.COMPLETED,
                result=f"/uploads/converts/{os.path.basename(result)}"
            )
        else:
            # 失败后更新任务状态
            task_manager.update_task(
                task_id,
                TaskStatus.FAILED,
                error=result
            )
            
    except Exception as e:
        # 发生异常时更新任务状态
        task_manager.update_task(
            task_id,
            TaskStatus.FAILED,
            error=str(e)
        )

@router.post("/convert")
async def convert_pdf(request: PDFRequest, background_tasks: BackgroundTasks):
    """
    启动PDF转换任务
    """
    # 创建新任务
    task_id = task_manager.create_task()
    
    # 在后台执行转换任务
    background_tasks.add_task(
        process_pdf_task,
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
    task = task_manager.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在")
    
    return {
        "task_id": task.id,
        "status": task.status,
        "result": task.result,
        "error": task.error
    }

# 定期清理旧任务
@router.on_event("startup")
@repeat_every(seconds=3600)  # 每小时执行一次
async def clean_old_tasks():
    task_manager.clean_old_tasks()

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
        pdf_name = f"{os.urandom(8).hex()}_{os.path.splitext(os.path.basename(pdf_path))[0]}"
        output_html = os.path.join(output_dir, f"{pdf_name}.html")
        
        # 构建docker命令
        cmd = [
            "docker", "run", "-ti", "--rm",
            "--mount", f"src={os.path.dirname(os.path.abspath(pdf_path))},target=/pdf,type=bind",
            "pdf2htmlex/pdf2htmlex:0.18.8.rc2-master-20200820-ubuntu-20.04-x86_64",
            "--zoom", "1.3",
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
        # 创建临时PDF文件名
        # http://localhost:8090/uploads/4503084ae82832a4_paper.pdf

        temp_pdf = f"{os.urandom(8).hex()}_{pdf_url.split('uploads/')[1]}.pdf"
        pdf_path = os.path.join(work_dir, temp_pdf)
        
        # 解析 URL
        parsed_url = urlparse(pdf_url)
        
        # 检查是否是本地 uvicorn 服务的文件
        if parsed_url.netloc in ['localhost:8090', '127.0.0.1:8090']:
            try:
                # 从 URL 路径中提取文件名
                url_path = parsed_url.path
                if url_path.startswith('/uploads/'):
                    # 构建源文件的实际路径
                    relative_path = url_path.replace('/uploads/', '')
                    source_path = Path(UPLOADS_DIR) / relative_path
                    
                    if not source_path.exists():
                        return False, f"文件不存在: {source_path}"
                    
                    # 直接复制文件
                    shutil.copy2(source_path, pdf_path)
                    print(f"本地文件复制成功: {source_path} -> {pdf_path}")
                else:
                    return False, "无效的文件路径"
                    
            except Exception as e:
                return False, f"本地文件处理失败: {str(e)}"
        else:
            # 对于其他URL（如 VSCode Live Server），使用 requests 下载
            success = download_pdf(pdf_url, pdf_path)
            if not success:
                return False, "PDF下载失败"
        
        # 转换为HTML
        success, result = convert_pdf_to_html(pdf_path, work_dir)
        
        # 清理临时PDF文件
        try:
            os.remove(pdf_path)
        except:
            pass
        
        return success, result
        
    except Exception as e:
        return False, f"处理失败: {str(e)}"
