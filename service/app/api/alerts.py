import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from croniter import croniter

from app.database import get_db
from app.models.alert import Alert, AlertCreate, AlertResponse, ChannelType, ScheduleType
from app.scheduler.manager import scheduler_manager
from app.scheduler.runner import execute_alert

router = APIRouter(prefix="/alerts", tags=["Alerts"])

def determine_channel_type(phone: Optional[str], email: Optional[str]) -> ChannelType:
    has_phone = bool(phone and phone.strip())
    has_email = bool(email and email.strip())
    if has_phone and has_email:
        return ChannelType.BOTH
    elif has_phone:
        return ChannelType.WHATSAPP
    elif has_email:
        return ChannelType.EMAIL
    raise ValueError("Neither phone number nor email provided.")

@router.get("", response_model=List[AlertResponse])
def get_alerts(db: Session = Depends(get_db)):
    """Fetch all alerts ordered by creation date descending."""
    return db.query(Alert).order_by(Alert.created_at.desc()).all()

@router.post("", response_model=AlertResponse, status_code=status.HTTP_201_CREATED)
def create_alert(payload: AlertCreate, db: Session = Depends(get_db)):
    """Create a new alert and register it with the scheduler."""
    channel_type = determine_channel_type(payload.phone_number, payload.email)
    
    now_utc = datetime.now(timezone.utc)
    next_run = None
    
    if payload.schedule_type == ScheduleType.STATIC:
        if payload.run_at:
            next_run = payload.run_at
            if next_run.tzinfo is None:
                next_run = next_run.replace(tzinfo=timezone.utc)
    elif payload.schedule_type == ScheduleType.CRON:
        if payload.cron_expression:
            itr = croniter(payload.cron_expression.strip(), now_utc)
            next_run = itr.get_next(datetime)

    alert = Alert(
        id=str(uuid.uuid4()),
        business_name=payload.business_name.strip(),
        client_name=payload.client_name.strip(),
        phone_number=payload.phone_number.strip() if payload.phone_number else None,
        email=payload.email.strip() if payload.email else None,
        subject=payload.subject.strip(),
        body=payload.body.strip(),
        schedule_type=payload.schedule_type,
        run_at=payload.run_at,
        cron_expression=payload.cron_expression.strip() if payload.cron_expression else None,
        channel_type=channel_type,
        is_active=payload.is_active,
        created_at=now_utc,
        updated_at=now_utc,
        next_run_at=next_run
    )

    db.add(alert)
    db.commit()
    db.refresh(alert)

    # Register in scheduler
    if alert.is_active:
        scheduler_manager.add_alert_job(alert)

    return alert

@router.get("/{alert_id}", response_model=AlertResponse)
def get_alert(alert_id: str, db: Session = Depends(get_db)):
    """Retrieve an alert by ID."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert

@router.delete("/{alert_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_alert(alert_id: str, db: Session = Depends(get_db)):
    """Delete an alert and deregister its scheduler job."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    scheduler_manager.remove_alert_job(alert_id)
    db.delete(alert)
    db.commit()
    return None

@router.post("/{alert_id}/trigger", status_code=status.HTTP_200_OK)
async def trigger_alert_now(alert_id: str, db: Session = Depends(get_db)):
    """Manually triggers an alert immediately and records an execution log."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    # Execute dispatch logic directly
    await execute_alert(alert_id)
    return {"message": f"Alert '{alert.subject}' triggered immediately. Check /logs for result."}

@router.patch("/{alert_id}/toggle", response_model=AlertResponse)
def toggle_alert_active(alert_id: str, db: Session = Depends(get_db)):
    """Toggles an alert between active and paused states."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.is_active = not alert.is_active
    alert.updated_at = datetime.now(timezone.utc)
    
    if alert.is_active:
        scheduler_manager.add_alert_job(alert)
    else:
        scheduler_manager.remove_alert_job(alert_id)
        
    db.commit()
    db.refresh(alert)
    return alert
