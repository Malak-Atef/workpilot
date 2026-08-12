from datetime import datetime, timezone
from typing import Optional, Dict, Any
from sqlmodel import Session, select
from models import Suggestion, PlannedItem, WorkLog

import json
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from sqlmodel import Session, select
from models import Suggestion, PlannedItem, WorkLog, current_iso

def confirm_suggestion(
    suggestion_id: str,
    resolution: Optional[str] = None,
    action: Optional[str] = None,
    title_override: Optional[str] = None,
    date_override: Optional[str] = None,
    category_override: Optional[str] = None,
    session: Session = None
) -> Dict[str, Any]:
    statement = select(Suggestion).where(Suggestion.id == suggestion_id)
    suggestion = session.exec(statement).first()
    if not suggestion:
        raise ValueError(f"Suggestion {suggestion_id} not found")

    # Parse payload
    payload_data = {}
    if isinstance(suggestion.payload, str):
        try:
            payload_data = json.loads(suggestion.payload)
        except Exception:
            payload_data = {}
    elif isinstance(suggestion.payload, dict):
        payload_data = suggestion.payload

    suggested_title = payload_data.get("suggested_title", "")
    suggested_date = payload_data.get("suggested_date", "")
    suggested_category = payload_data.get("suggested_category", "IT Ops")

    title = title_override or suggested_title
    date = date_override or suggested_date
    category = category_override or suggested_category

    s_type = suggestion.suggestion_type

    if s_type == "planned_item":
        planned_item = PlannedItem(
            title=title,
            date=date,
            category=category,
            status="planned",
            source="suggestion",
            source_ref_id=suggestion.id,
            created_at=current_iso(),
            updated_at=current_iso()
        )
        session.add(planned_item)
        session.flush()

        suggestion.status = "confirmed"
        suggestion.resulting_id = planned_item.id
        suggestion.updated_at = current_iso()
        session.add(suggestion)
        session.commit()
        session.refresh(planned_item)

        return {
            "type": "planned_item",
            "item": planned_item.model_dump()
        }

    elif s_type in ["completed_work", "work_log"]:
        res = resolution or action

        if suggestion.matched_planned_item_id is not None:
            # Normalize resolution
            if res == "mark_done":
                res = "mark_planned_item_done"
            elif res == "create_new":
                res = "create_new_work_log"

            if not res or res not in ["mark_planned_item_done", "create_new_work_log"]:
                raise ValueError("Resolution is required when matched_planned_item_id exists. Valid values: 'mark_planned_item_done' or 'create_new_work_log'")

            if res == "mark_planned_item_done":
                planned_item = session.get(PlannedItem, suggestion.matched_planned_item_id)
                work_log = WorkLog(
                    title=planned_item.title if planned_item else title,
                    date=date,
                    category=planned_item.category if planned_item else category,
                    status="completed",
                    created_at=current_iso(),
                    updated_at=current_iso()
                )
                session.add(work_log)
                session.flush()

                if planned_item:
                    planned_item.status = "done"
                    planned_item.work_log_id = work_log.id
                    planned_item.updated_at = current_iso()
                    session.add(planned_item)

                suggestion.status = "confirmed"
                suggestion.resulting_id = work_log.id
                suggestion.updated_at = current_iso()
                session.add(suggestion)
                session.commit()
                session.refresh(work_log)

                return {
                    "type": "completed_work",
                    "action": "marked_done",
                    "work_log": work_log.model_dump(),
                    "planned_item": planned_item.model_dump() if planned_item else None
                }

            elif res == "create_new_work_log":
                work_log = WorkLog(
                    title=title,
                    date=date,
                    category=category,
                    status="completed",
                    created_at=current_iso(),
                    updated_at=current_iso()
                )
                session.add(work_log)
                session.flush()

                suggestion.status = "confirmed"
                suggestion.resulting_id = work_log.id
                suggestion.updated_at = current_iso()
                session.add(suggestion)
                session.commit()
                session.refresh(work_log)

                return {
                    "type": "completed_work",
                    "action": "created_new",
                    "work_log": work_log.model_dump()
                }

        # No matched_planned_item_id
        work_log = WorkLog(
            title=title,
            date=date,
            category=category,
            status="completed",
            created_at=current_iso(),
            updated_at=current_iso()
        )
        session.add(work_log)
        session.flush()

        suggestion.status = "confirmed"
        suggestion.resulting_id = work_log.id
        suggestion.updated_at = current_iso()
        session.add(suggestion)
        session.commit()
        session.refresh(work_log)

        return {
            "type": "completed_work",
            "action": "created_new",
            "work_log": work_log.model_dump()
        }

    else:
        raise ValueError(f"Unknown suggestion type {s_type}")


def dismiss_suggestion(suggestion_id: str, session: Session) -> Dict[str, Any]:
    statement = select(Suggestion).where(Suggestion.id == suggestion_id)
    suggestion = session.exec(statement).first()
    if not suggestion:
        raise ValueError(f"Suggestion {suggestion_id} not found")

    suggestion.status = "dismissed"
    suggestion.updated_at = current_iso()
    session.add(suggestion)
    session.commit()
    return {"status": "dismissed", "id": suggestion_id}
