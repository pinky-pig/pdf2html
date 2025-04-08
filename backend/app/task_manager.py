import asyncio
from datetime import datetime
import uuid
from typing import Dict, Optional
from .models.task import Task, TaskStatus

class TaskManager:
    def __init__(self):
        self.tasks: Dict[str, Task] = {}
    
    def create_task(self) -> str:
        task_id = str(uuid.uuid4())
        self.tasks[task_id] = Task(
            id=task_id,
            status=TaskStatus.PENDING,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        return task_id
    
    def update_task(self, task_id: str, status: TaskStatus, result: Optional[str] = None, error: Optional[str] = None):
        if task_id in self.tasks:
            task = self.tasks[task_id]
            task.status = status
            task.updated_at = datetime.now()
            if result is not None:
                task.result = result
            if error is not None:
                task.error = error
    
    def get_task(self, task_id: str) -> Optional[Task]:
        return self.tasks.get(task_id)
    
    def clean_old_tasks(self, max_age_hours: int = 24):
        """清理旧任务"""
        now = datetime.now()
        self.tasks = {
            task_id: task 
            for task_id, task in self.tasks.items() 
            if (now - task.updated_at).total_seconds() < max_age_hours * 3600
        }

# 创建全局任务管理器实例
task_manager = TaskManager() 