import json
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List, Optional, Any, Dict
from pydantic import BaseModel

from database import get_session
from models import Suggestion
from services.capture_service import process_capture
from services.confirm_service import confirm_suggestion, dismiss_suggestion

router = APIRouter(prefix="/api/v1", tags=["capture"])

class CaptureRequest(BaseModel):
    raw_text: str

class ConfirmRequest(BaseModel):
    resolution: Optional[str] = None  # mark_planned_item_done | create_new_work_log
    action: Optional[str] = None      # mark_done | create_new
    title_override: Optional[str] = None
    date_override: Optional[str] = None
    category_override: Optional[str] = None

def format_suggestion_response(s: Suggestion) -> Dict[str, Any]:
    data = s.model_dump()
    payload_data = {}
    if isinstance(s.payload, str):
        try:
            payload_data = json.loads(s.payload)
        except Exception:
            pass
    elif isinstance(s.payload, dict):
        payload_data = s.payload

    data["payload"] = payload_data
    data["suggested_title"] = payload_data.get("suggested_title")
    data["suggested_date"] = payload_data.get("suggested_date")
    data["suggested_category"] = payload_data.get("suggested_category", "IT Ops")
    data["confidence"] = payload_data.get("confidence", 0.95)
    data["matched_planned_item_title"] = payload_data.get("matched_planned_item_title")
    data["matched_planned_item_date"] = payload_data.get("matched_planned_item_date")
    return data

@router.post("/capture")
def capture_work(req: CaptureRequest, session: Session = Depends(get_session)):
    if not req.raw_text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    suggestions = process_capture(req.raw_text, session)
    return [format_suggestion_response(s) for s in suggestions]

@router.get("/suggestions/pending")
def get_pending_suggestions(session: Session = Depends(get_session)):
    statement = select(Suggestion).where(Suggestion.status == "pending")
    suggestions = session.exec(statement).all()
    return [format_suggestion_response(s) for s in suggestions]

@router.post("/suggestions/{suggestion_id}/confirm")
def confirm_sug(
    suggestion_id: str,
    body: Optional[ConfirmRequest] = None,
    session: Session = Depends(get_session)
):
    try:
        req_data = body or ConfirmRequest()
        return confirm_suggestion(
            suggestion_id=suggestion_id,
            resolution=req_data.resolution,
            action=req_data.action,
            title_override=req_data.title_override,
            date_override=req_data.date_override,
            category_override=req_data.category_override,
            session=session
        )
    except ValueError as e:
        err_msg = str(e)
        if "not found" in err_msg.lower():
            raise HTTPException(status_code=404, detail=err_msg)
        else:
            raise HTTPException(status_code=400, detail=err_msg)

@router.post("/suggestions/{suggestion_id}/dismiss")
def dismiss_sug(suggestion_id: str, session: Session = Depends(get_session)):
    try:
        return dismiss_suggestion(suggestion_id=suggestion_id, session=session)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
