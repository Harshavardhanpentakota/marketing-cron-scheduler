from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.log import AlertLog, AlertLogResponse

router = APIRouter(prefix="/logs", tags=["Logs"])

@router.get("", response_model=List[AlertLogResponse])
def get_logs(
    alert_id: Optional[str] = Query(None, description="Filter logs by specific alert ID"),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """Retrieve execution logs, optionally filtered by alert_id."""
    query = db.query(AlertLog)
    if alert_id:
        query = query.filter(AlertLog.alert_id == alert_id)
    return query.order_by(AlertLog.executed_at.desc()).limit(limit).all()

@router.get("/{log_id}", response_model=AlertLogResponse)
def get_log(log_id: str, db: Session = Depends(get_db)):
    """Retrieve detailed log entry by ID."""
    log = db.query(AlertLog).filter(AlertLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log entry not found")
    return log
