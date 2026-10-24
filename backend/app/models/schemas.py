from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime

class SeverityLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class IncidentStatus(str, Enum):
    OPEN = "open"
    INVESTIGATING = "investigating"
    REMEDIATING = "remediating"
    RESOLVED = "resolved"

class AgentStatus(str, Enum):
    IDLE = "idle"
    ACTIVE = "active"
    ALERT = "alert"
    OFFLINE = "offline"

class Incident(BaseModel):
    id: str
    title: str
    service: str
    severity: SeverityLevel
    status: IncidentStatus
    detected_at: datetime
    root_cause: Optional[str] = None
    suggested_action: Optional[str] = None
    ai_confidence: float = 0.95

class OpsAgent(BaseModel):
    id: str
    name: str
    role: str
    status: AgentStatus
    current_task: Optional[str] = None
    actions_count: int = 0
    accuracy_rate: float = 0.98

class SystemMetric(BaseModel):
    name: str
    value: float
    unit: str
    status: str
    change_pct: float

class RunbookStep(BaseModel):
    step_id: int
    title: str
    command_or_action: str
    status: str = "pending"

class Runbook(BaseModel):
    id: str
    name: str
    target_service: str
    steps: List[RunbookStep]
    auto_trigger: bool = False
