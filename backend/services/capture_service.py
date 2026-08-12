import json
from sqlmodel import Session
from models import CapturedItem, Suggestion, current_iso
from services.interpreter import RuleBasedInterpreter
from services.matcher import find_matching_planned_item
from typing import List

def process_capture(raw_text: str, session: Session) -> List[Suggestion]:
    # 1. Save CapturedItem
    captured_item = CapturedItem(
        raw_text=raw_text,
        captured_at=current_iso(),
        interpretation_status="processed",
        created_at=current_iso()
    )
    session.add(captured_item)
    session.commit()
    session.refresh(captured_item)

    # 2. Interpret text
    interpreter = RuleBasedInterpreter()
    interpretations = interpreter.interpret(raw_text)

    created_suggestions: List[Suggestion] = []

    # 3. Build Suggestion records
    for interp in interpretations:
        matched_item = None
        s_type = interp["suggested_type"]

        if s_type in ["completed_work", "work_log"]:
            matched_item = find_matching_planned_item(
                session=session,
                suggested_title=interp["suggested_title"],
                reference_date_str=interp["suggested_date"],
                threshold=0.5
            )

        payload_dict = {
            "suggested_title": interp["suggested_title"],
            "suggested_date": interp["suggested_date"],
            "suggested_category": interp.get("suggested_category", "IT Ops"),
            "confidence": interp.get("confidence", 0.95)
        }

        if matched_item:
            payload_dict["matched_planned_item_title"] = matched_item.title
            payload_dict["matched_planned_item_date"] = matched_item.date

        suggestion = Suggestion(
            payload=json.dumps(payload_dict),
            suggestion_type=s_type,
            source="rule_interpreter",
            source_ref_id=str(captured_item.id),
            matched_planned_item_id=matched_item.id if matched_item else None,
            status="pending",
            created_at=current_iso(),
            updated_at=current_iso()
        )

        session.add(suggestion)
        session.commit()
        session.refresh(suggestion)
        created_suggestions.append(suggestion)

    return created_suggestions
