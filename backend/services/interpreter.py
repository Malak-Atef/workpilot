import re
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional

class WorkInterpreter:
    def interpret(self, raw_text: str, captured_at: Optional[datetime] = None) -> List[Dict[str, Any]]:
        raise NotImplementedError

class RuleBasedInterpreter(WorkInterpreter):
    WEEKDAYS = {
        "monday": 0,
        "tuesday": 1,
        "wednesday": 2,
        "thursday": 3,
        "friday": 4,
        "saturday": 5,
        "sunday": 6
    }

    COMPLETION_KEYWORDS = [
        "finished", "done", "completed", "resolved", "fixed"
    ]

    def interpret(self, raw_text: str, captured_at: Optional[datetime] = None) -> List[Dict[str, Any]]:
        if captured_at is None:
            captured_at = datetime.now(timezone.utc)

        text_lower = raw_text.strip().lower()

        # Determine if completed work or planned item
        is_completed = False
        for kw in self.COMPLETION_KEYWORDS:
            if re.search(rf"\b{kw}\b", text_lower):
                is_completed = True
                break

        suggested_type = "completed_work" if is_completed else "planned_item"

        # Determine target date
        target_date = captured_at.date()
        
        if "tomorrow" in text_lower:
            target_date = captured_at.date() + timedelta(days=1)
        elif "today" in text_lower:
            target_date = captured_at.date()
        else:
            # Check weekday names
            for day_name, day_idx in self.WEEKDAYS.items():
                if day_name in text_lower:
                    current_idx = captured_at.weekday()
                    days_ahead = (day_idx - current_idx) % 7
                    if days_ahead == 0:
                        days_ahead = 7
                    target_date = captured_at.date() + timedelta(days=days_ahead)
                    break

        # Clean title by stripping keywords like "tomorrow", "today", "finished", "done"
        clean_title = raw_text.strip()
        words_to_strip = ["tomorrow", "today", "finished", "done", "completed", "resolved"]
        for w in words_to_strip:
            clean_title = re.sub(rf"\b{w}\b", "", clean_title, flags=re.IGNORECASE)

        # Clean trailing/leading spaces & extra punctuation
        clean_title = re.sub(r"\s+", " ", clean_title).strip()
        if not clean_title:
            clean_title = raw_text.strip()

        # Capitalize first letter
        clean_title = clean_title[0].upper() + clean_title[1:] if len(clean_title) > 0 else clean_title

        suggestion = {
            "suggested_title": clean_title,
            "suggested_date": target_date.strftime("%Y-%m-%d"),
            "suggested_category": "IT Ops",
            "suggested_type": suggested_type,
            "confidence": 0.95
        }

        # Return a LIST of suggestions (future-proof architecture)
        return [suggestion]
