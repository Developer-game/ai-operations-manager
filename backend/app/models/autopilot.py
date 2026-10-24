from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

class EventPhase(str, Enum):
    PLANNING = "planning"
    PROMOTIONS = "promotions"
    EVENT_DAY = "event_day"
    POST_PRODUCTION = "post_production"
    WRAPUP = "wrapup"

class TaskStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    BLOCKED = "blocked"

class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class VolunteerStatus(str, Enum):
    AVAILABLE = "available"
    UNAVAILABLE = "unavailable"
    OVERLOADED = "overloaded"

class AssetStatus(str, Enum):
    MISSING = "missing"
    IN_PROGRESS = "in_progress"
    IN_REVIEW = "in_review"
    APPROVED = "approved"
    UPLOADED = "uploaded"

class ApprovalStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

# Models
class Volunteer(BaseModel):
    id: str
    event_id: str
    name: str
    role: str
    phone: str
    email: Optional[str] = None
    skills: List[str] = []
    status: VolunteerStatus = VolunteerStatus.AVAILABLE
    max_capacity: int = 5
    assigned_tasks_count: int = 0

class Task(BaseModel):
    id: str
    event_id: str
    title: str
    description: Optional[str] = None
    role_needed: str
    assignee_id: Optional[str] = None
    assignee_name: Optional[str] = None
    phase: EventPhase
    deadline_relative: str  # e.g. "T-5 Days", "T-24 Hours", "T+2 Days"
    dependencies: List[str] = []  # list of task IDs
    status: TaskStatus = TaskStatus.PENDING
    priority: TaskPriority = TaskPriority.MEDIUM
    asset_required: Optional[str] = None  # name/type of asset if any

class AssetItem(BaseModel):
    id: str
    event_id: str
    title: str
    asset_type: str  # "poster", "teaser_video", "raw_photos", "recap_video", "slides"
    drive_url: Optional[str] = None
    status: AssetStatus = AssetStatus.MISSING
    expected_by: str
    owner_role: str
    notes: Optional[str] = None

class WhatsAppDraft(BaseModel):
    id: str
    event_id: str
    recipient_name: str
    phone: str
    recipient_role: Optional[str] = None
    context: str  # "dropout_alert", "missing_asset_warning", "broadcast_invite", "task_reminder"
    message_body: str
    status: str = "draft"  # "draft", "approved", "sent"
    created_at: str

class ApprovalItem(BaseModel):
    id: str
    event_id: str
    approval_type: str  # "reallocation", "whatsapp_send", "deadline_shift", "asset_override"
    title: str
    details: str
    proposed_action: Dict[str, Any] = {}
    status: ApprovalStatus = ApprovalStatus.PENDING
    created_at: str

class Event(BaseModel):
    id: str
    title: str
    description: str
    category: str  # "workshop", "hackathon", "seminar", "competition"
    date_str: str  # e.g. "Nov 15, 2026"
    venue: str
    expected_audience: int
    budget: Optional[str] = None
    phase: EventPhase = EventPhase.PLANNING
    created_at: str

class EventStateResponse(BaseModel):
    event: Event
    volunteers: List[Volunteer]
    tasks: List[Task]
    assets: List[AssetItem]
    approvals: List[ApprovalItem]
    whatsapp_drafts: List[WhatsAppDraft]
    audit_logs: List[str]
    unassigned_tasks_count: int
    bottlenecks_count: int

# Request Schemas
class CreateVolunteerRequest(BaseModel):
    name: str
    role: str
    phone: str
    email: Optional[str] = None
    skills: List[str] = []

class CreateEventRequest(BaseModel):
    title: str
    description: str
    category: str = "workshop"
    date_str: str
    venue: str
    expected_audience: int = 50
    budget: Optional[str] = "$200"
    volunteers: List[CreateVolunteerRequest] = []
    planned_activities: List[str] = []

class UpdatePhaseRequest(BaseModel):
    phase: EventPhase

class DropoutRequest(BaseModel):
    volunteer_id: str
    reason: Optional[str] = "Unavailable due to exams/illness"

class ApprovalActionRequest(BaseModel):
    status: ApprovalStatus  # "approved" or "rejected"

class SettingsUpdateRequest(BaseModel):
    api_key: Optional[str] = None
    gemma_model: Optional[str] = None
