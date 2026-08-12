from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from typing import List, Optional
from datetime import datetime, timezone

from database import get_session
from models import PlannedItem

router = APIRouter(prefix="/api/v1/planned-items", tags=["planned_items"])

@router.get("", response_model=List[PlannedItem])
def get_planned_items(
    week_start: Optional[str] = Query(None),
    week_end: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    session: Session = Depends(get_session)
):
    query = select(PlannedItem)
    if week_start and week_end:
        query = query.where(PlannedItem.date >= week_start, PlannedItem.date <= week_end)
    elif week_start:
        query = query.where(PlannedItem.date >= week_start)
    if status:
        query = query.where(PlannedItem.status == status)
    
    return session.exec(query).all()

@router.post("", response_model=PlannedItem)
def create_planned_item(item: PlannedItem, session: Session = Depends(get_session)):
    session.add(item)
    session.commit()
    session.refresh(item)
    return item

@router.patch("/{item_id}", response_model=PlannedItem)
def update_planned_item(
    item_id: int,
    updates: dict,
    session: Session = Depends(get_session)
):
    item = session.get(PlannedItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    for key, value in updates.items():
        if hasattr(item, key):
            setattr(item, key, value)
    
    item.updated_at = datetime.now(timezone.utc).isoformat()
    session.add(item)
    session.commit()
    session.refresh(item)
    return item

@router.delete("/{item_id}")
def delete_planned_item(item_id: int, session: Session = Depends(get_session)):
    item = session.get(PlannedItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    session.delete(item)
    session.commit()
    return {"ok": True, "deleted_id": item_id}
