from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from typing import List, Optional
from datetime import datetime, timezone

from database import get_session
from models import WorkLog

router = APIRouter(prefix="/api/v1/work-logs", tags=["work_logs"])

@router.get("", response_model=List[WorkLog])
def get_work_logs(
    date: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    session: Session = Depends(get_session)
):
    query = select(WorkLog)
    if date:
        query = query.where(WorkLog.date == date)
    if status:
        query = query.where(WorkLog.status == status)
    
    query = query.order_by(WorkLog.date.desc(), WorkLog.id.desc())
    return session.exec(query).all()

@router.post("", response_model=WorkLog)
def create_work_log(log: WorkLog, session: Session = Depends(get_session)):
    session.add(log)
    session.commit()
    session.refresh(log)
    return log

@router.patch("/{log_id}", response_model=WorkLog)
def update_work_log(
    log_id: int,
    updates: dict,
    session: Session = Depends(get_session)
):
    log = session.get(WorkLog, log_id)
    if not log:
        raise HTTPException(status_code=404, detail="Work log not found")

    for key, value in updates.items():
        if hasattr(log, key):
            setattr(log, key, value)
    
    log.updated_at = datetime.now(timezone.utc).isoformat()
    session.add(log)
    session.commit()
    session.refresh(log)
    return log

@router.delete("/{log_id}")
def delete_work_log(log_id: int, session: Session = Depends(get_session)):
    log = session.get(WorkLog, log_id)
    if not log:
        raise HTTPException(status_code=404, detail="Work log not found")
    session.delete(log)
    session.commit()
    return {"ok": True, "deleted_id": log_id}
