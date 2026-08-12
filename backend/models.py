from datetime import datetime, timezone
from typing import Optional
from sqlmodel import Field, SQLModel
import uuid

def current_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

class PlannedItem(SQLModel, table=True):
    __tablename__ = "planned_items"

    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    description: Optional[str] = Field(default=None)
    category: Optional[str] = Field(default="IT Ops")
    date: str  # YYYY-MM-DD
    start_time: Optional[str] = Field(default=None)
    end_time: Optional[str] = Field(default=None)
    status: str = Field(default="planned")  # planned, done, dismissed
    source: str = Field(default="manual")  # manual, suggestion
    source_ref_id: Optional[str] = Field(default=None)
    work_log_id: Optional[int] = Field(default=None, foreign_key="work_logs.id")
    created_at: str = Field(default_factory=current_iso)
    updated_at: str = Field(default_factory=current_iso)


class WorkLog(SQLModel, table=True):
    __tablename__ = "work_logs"

    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    description: Optional[str] = Field(default=None)
    category: Optional[str] = Field(default="General")
    date: str  # YYYY-MM-DD
    start_time: Optional[str] = Field(default=None)
    end_time: Optional[str] = Field(default=None)
    duration_hours: Optional[float] = Field(default=None)
    status: str = Field(default="completed")  # completed, in_progress
    location: Optional[str] = Field(default=None)
    created_at: str = Field(default_factory=current_iso)
    updated_at: str = Field(default_factory=current_iso)


class CapturedItem(SQLModel, table=True):
    __tablename__ = "captured_items"

    id: Optional[int] = Field(default=None, primary_key=True)
    raw_text: str
    captured_at: str = Field(default_factory=current_iso)
    interpretation_status: str = Field(default="pending")
    created_at: str = Field(default_factory=current_iso)


class Suggestion(SQLModel, table=True):
    __tablename__ = "suggestions"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    payload: str = Field(...)  # JSON string containing suggestion parameters
    suggestion_type: str = Field(...)  # planned_item, completed_work, work_log
    source: str = Field(default="rule_interpreter")
    source_ref_id: Optional[str] = Field(default=None)
    matched_planned_item_id: Optional[int] = Field(default=None)
    status: str = Field(default="pending")  # pending, confirmed, dismissed
    resulting_id: Optional[int] = Field(default=None)
    created_at: str = Field(default_factory=current_iso)
    updated_at: str = Field(default_factory=current_iso)
