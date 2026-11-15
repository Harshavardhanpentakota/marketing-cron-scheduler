import enum
import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import Column, String, Text, Integer, DateTime, Enum as SQLEnum, ForeignKey
from pydantic import BaseModel
from app.database import Base

class LogStatus(str, enum.Enum):
    SUCCESS = "SUCCESS"
    PARTIAL = "PARTIAL"
    FAILED = "FAILED"

class AlertLog(Base):
    __tablename__ = "alert_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    alert_id = Column(String(36), ForeignKey("alerts.id", ondelete="CASCADE"), nullable=False, index=True)
    executed_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    status = Column(SQLEnum(LogStatus), nullable=False)
    
    channels_attempted = Column(String(50), nullable=False)  # e.g. "whatsapp,email"
    whatsapp_status = Column(String(20), nullable=True)     # SUCCESS, FAILED, SKIPPED
    whatsapp_response = Column(Text, nullable=True)
    email_status = Column(String(20), nullable=True)        # SUCCESS, FAILED, SKIPPED
    email_response = Column(Text, nullable=True)
    
    rendered_subject = Column(String(255), nullable=True)
    rendered_body = Column(Text, nullable=True)
    duration_ms = Column(Integer, default=0, nullable=False)

# Pydantic Schemas
class AlertLogResponse(BaseModel):
    id: str
    alert_id: str
    executed_at: datetime
    status: LogStatus
    channels_attempted: str
    whatsapp_status: Optional[str] = None
    whatsapp_response: Optional[str] = None
    email_status: Optional[str] = None
    email_response: Optional[str] = None
    rendered_subject: Optional[str] = None
    rendered_body: Optional[str] = None
    duration_ms: int

    class Config:
        from_attributes = True
