import re
from datetime import datetime, timedelta
from typing import Optional, List
from sqlmodel import Session, select
from models import PlannedItem

STOPWORDS = {
    "a", "an", "the", "in", "on", "at", "to", "for", "of", "with", "by", "from",
    "up", "about", "into", "over", "after", "and", "or", "is", "are", "was",
    "were", "be", "been", "being", "check", "do", "did", "finished", "done",
    "completed", "resolved", "fixed", "restock"
}

def normalize_text(text: str) -> set:
    text_lower = text.lower()
    clean_text = re.sub(r"[^\w\s]", "", text_lower)
    words = clean_text.split()
    return {w for w in words if w not in STOPWORDS and len(w) > 1}

def find_matching_planned_item(
    session: Session,
    suggested_title: str,
    reference_date_str: str,
    threshold: float = 0.5
) -> Optional[PlannedItem]:
    try:
        ref_date = datetime.strptime(reference_date_str, "%Y-%m-%d").date()
    except Exception:
        ref_date = datetime.now().date()

    start_date = (ref_date - timedelta(days=1)).strftime("%Y-%m-%d")
    end_date = (ref_date + timedelta(days=3)).strftime("%Y-%m-%d")

    # Fetch candidate planned items within window with status 'planned'
    statement = select(PlannedItem).where(
        PlannedItem.status == "planned",
        PlannedItem.date >= start_date,
        PlannedItem.date <= end_date
    )
    candidates = session.exec(statement).all()

    target_keywords = normalize_text(suggested_title)
    if not target_keywords:
        return None

    best_match: Optional[PlannedItem] = None
    best_score = 0.0

    for candidate in candidates:
        cand_keywords = normalize_text(candidate.title)
        if not cand_keywords:
            continue

        overlap = target_keywords.intersection(cand_keywords)
        # Jaccard / Overlap score
        union = target_keywords.union(cand_keywords)
        score = len(overlap) / len(union) if union else 0.0

        if score >= threshold and score > best_score:
            best_score = score
            best_match = candidate

    return best_match
