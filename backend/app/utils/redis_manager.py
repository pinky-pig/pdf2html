from redis import asyncio as aioredis
from enum import Enum
import json
from typing import Optional, Dict, Any
import os
import time

class TaskStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class RedisManager:
    def __init__(self):
        # 从环境变量获取 Redis 配置，如果没有则使用默认值
        redis_url = os.environ.get("REDIS_URL", "redis://localhost")
        self.redis = aioredis.from_url(redis_url, decode_responses=True)
        
    async def set_task(self, task_id: str, data: Dict[str, Any]) -> None:
        """设置任务信息"""
        await self.redis.set(f"task:{task_id}", json.dumps(data))
        
    async def get_task(self, task_id: str) -> Optional[Dict[str, Any]]:
        """获取任务信息"""
        data = await self.redis.get(f"task:{task_id}")
        return json.loads(data) if data else None
        
    async def update_task_status(self, task_id: str, status: TaskStatus, result: str = None, error: str = None) -> None:
        """更新任务状态"""
        task = await self.get_task(task_id)
        if task:
            task.update({
                "status": status,
                "result": result,
                "error": error
            })
            await self.set_task(task_id, task)
            
    async def delete_task(self, task_id: str) -> None:
        """删除任务"""
        await self.redis.delete(f"task:{task_id}")
        
    async def cleanup_old_tasks(self, max_age_seconds: int = 86400) -> None:
        """清理旧任务（默认24小时）"""
        async for key in self.redis.scan_iter("task:*"):
            task = await self.get_task(key.split(":")[1])
            if task and task.get("created_at", 0) < time.time() - max_age_seconds:
                await self.delete_task(key.split(":")[1])

# 创建全局 Redis 管理器实例
redis_manager = RedisManager() 