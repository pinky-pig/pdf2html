from enum import Enum
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class TaskStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class Task(BaseModel):
    id: str
    status: TaskStatus
    created_at: datetime
    updated_at: datetime
    result: Optional[str] = None
    error: Optional[str] = None 