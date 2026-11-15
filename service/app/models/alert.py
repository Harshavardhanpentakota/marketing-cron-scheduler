import enum
import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import Column, String, Text, Boolean, DateTime, Enum as SQLEnum
from pydantic import BaseModel, Field, model_validator
from croniter import croniter
from app.database import Base

class ScheduleType(str, enum.Enum):
    STATIC = "STATIC"  # runs once at a specific datetime
    CRON = "CRON"      # recurring cron schedule

class ChannelType(str, enum.Enum):
    WHATSAPP = "WHATSAPP"
    EMAIL = "EMAIL"
    BOTH = "BOTH"

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    business_name = Column(String(100), nullable=False)
    client_name = Column(String(100), nullable=False)
    phone_number = Column(String(30), nullable=True)
    email = Column(String(255), nullable=True)
    subject = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)
    
    schedule_type = Column(SQLEnum(ScheduleType), nullable=False, default=ScheduleType.STATIC)
    run_at = Column(DateTime(timezone=True), nullable=True)
    cron_expression = Column(String(100), nullable=True)
    
    channel_type = Column(SQLEnum(ChannelType), nullable=False, default=ChannelType.EMAIL)
    is_active = Column(Boolean, default=True, nullable=False)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    last_run_at = Column(DateTime(timezone=True), nullable=True)
    next_run_at = Column(DateTime(timezone=True), nullable=True)

# Pydantic Schemas
class AlertBase(BaseModel):
    business_name: str = Field(..., min_length=1, max_length=100)
    client_name: str = Field(..., min_length=1, max_length=100)
    phone_number: Optional[str] = Field(None, max_length=30)
    email: Optional[str] = Field(None, max_length=255)
    subject: str = Field(..., min_length=1, max_length=255)
    body: str = Field(..., min_length=1)
    schedule_type: ScheduleType = ScheduleType.STATIC
    run_at: Optional[datetime] = None
    cron_expression: Optional[str] = None
    is_active: bool = True

class AlertCreate(AlertBase):
    @model_validator(mode="after")
    def validate_channels_and_schedule(self):
        has_phone = bool(self.phone_number and self.phone_number.strip())
        has_email = bool(self.email and self.email.strip())
        
        if not has_phone and not has_email:
            raise ValueError("At least one contact method (phone number or email) must be provided.")
            
        if self.schedule_type == ScheduleType.STATIC:
            if not self.run_at:
                raise ValueError("Static alerts require a 'run_at' datetime.")
        elif self.schedule_type == ScheduleType.CRON:
            if not self.cron_expression or not self.cron_expression.strip():
                raise ValueError("Recurring alerts require a 'cron_expression'.")
            if not croniter.is_valid(self.cron_expression.strip()):
                raise ValueError(f"Invalid cron expression: {self.cron_expression}")
                
        return self

class AlertResponse(AlertBase):
    id: str
    channel_type: ChannelType
    created_at: datetime
    updated_at: datetime
    last_run_at: Optional[datetime] = None
    next_run_at: Optional[datetime] = None

    class Config:
        from_attributes = True
