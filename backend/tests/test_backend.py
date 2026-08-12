import os
import unittest
from datetime import datetime, timedelta
from sqlmodel import SQLModel, Session, create_engine, select

from models import PlannedItem, WorkLog, Suggestion, CapturedItem
from services.interpreter import RuleBasedInterpreter
from services.matcher import find_matching_planned_item
from services.capture_service import process_capture
from services.confirm_service import confirm_suggestion, dismiss_suggestion

class TestWorkPilotBackend(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
        SQLModel.metadata.create_all(self.engine)
        self.session = Session(self.engine)

    def tearDown(self):
        self.session.close()

    def test_01_planned_capture_and_suggestion_creation(self):
        """Test capturing 'Check school printers tomorrow' creates pending planned suggestion."""
        suggestions = process_capture("Check school printers tomorrow", self.session)
        self.assertEqual(len(suggestions), 1)
        sug = suggestions[0]
        self.assertEqual(sug.suggestion_type, "planned_item")
        self.assertEqual(sug.status, "pending")

        tomorrow_str = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        import json
        payload = json.loads(sug.payload)
        self.assertIn("Check school printers", payload["suggested_title"])
        self.assertEqual(payload["suggested_date"], tomorrow_str)

    def test_02_planned_suggestion_confirmation(self):
        """Test confirming a planned suggestion creates a PlannedItem."""
        suggestions = process_capture("Prepare laptops for MAP testing tomorrow", self.session)
        sug = suggestions[0]

        res = confirm_suggestion(sug.id, session=self.session)
        self.assertEqual(res["type"], "planned_item")

        items = self.session.exec(select(PlannedItem)).all()
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0].title, "Prepare laptops for MAP testing")
        self.assertEqual(items[0].status, "planned")

    def test_03_planner_week_query(self):
        """Test querying planned items for a specific week."""
        today = datetime.now().date()
        today_str = today.strftime("%Y-%m-%d")
        
        p = PlannedItem(title="Audit router", date=today_str, status="planned")
        self.session.add(p)
        self.session.commit()

        start_str = (today - timedelta(days=2)).strftime("%Y-%m-%d")
        end_str = (today + timedelta(days=5)).strftime("%Y-%m-%d")

        stmt = select(PlannedItem).where(PlannedItem.date >= start_str, PlannedItem.date <= end_str)
        items = self.session.exec(stmt).all()
        self.assertEqual(len(items), 1)

    def test_04_completed_work_capture_and_matching(self):
        """Test 'Finished checking school printers' matches existing PlannedItem."""
        today_str = datetime.now().strftime("%Y-%m-%d")
        p = PlannedItem(title="Check school printers", date=today_str, status="planned")
        self.session.add(p)
        self.session.commit()

        suggestions = process_capture("Finished checking school printers", self.session)
        self.assertEqual(len(suggestions), 1)
        sug = suggestions[0]
        self.assertIn(sug.suggestion_type, ["completed_work", "work_log"])
        self.assertEqual(sug.matched_planned_item_id, p.id)

    def test_05_explicit_confirmation_mark_done(self):
        """Test confirming completed work with 'mark_planned_item_done' updates PlannedItem and creates WorkLog."""
        today_str = datetime.now().strftime("%Y-%m-%d")
        p = PlannedItem(title="Check school printers", date=today_str, status="planned")
        self.session.add(p)
        self.session.commit()

        suggestions = process_capture("Finished checking school printers", self.session)
        sug = suggestions[0]

        res = confirm_suggestion(sug.id, resolution="mark_planned_item_done", session=self.session)
        self.assertEqual(res["action"], "marked_done")

        # Check PlannedItem updated
        updated_p = self.session.get(PlannedItem, p.id)
        self.assertEqual(updated_p.status, "done")

        # Check WorkLog created
        logs = self.session.exec(select(WorkLog)).all()
        self.assertEqual(len(logs), 1)
        self.assertEqual(logs[0].title, "Check school printers")

    def test_06_create_new_work_log_branch(self):
        """Test choosing 'create_new_work_log' on matched completion creates new WorkLog without updating PlannedItem."""
        today_str = datetime.now().strftime("%Y-%m-%d")
        p = PlannedItem(title="Check school printers", date=today_str, status="planned")
        self.session.add(p)
        self.session.commit()

        suggestions = process_capture("Finished checking school printers", self.session)
        sug = suggestions[0]

        res = confirm_suggestion(sug.id, resolution="create_new_work_log", session=self.session)
        self.assertEqual(res["action"], "created_new")

        # PlannedItem remains planned
        updated_p = self.session.get(PlannedItem, p.id)
        self.assertEqual(updated_p.status, "planned")

        # WorkLog created
        logs = self.session.exec(select(WorkLog)).all()
        self.assertEqual(len(logs), 1)

    def test_07_confirmation_safety_rejects_missing_resolution(self):
        """Regression test: confirming matched completed work without resolution raises ValueError."""
        today_str = datetime.now().strftime("%Y-%m-%d")
        p = PlannedItem(title="Check school printers", date=today_str, status="planned")
        self.session.add(p)
        self.session.commit()

        suggestions = process_capture("Finished checking school printers", self.session)
        sug = suggestions[0]

        with self.assertRaises(ValueError) as ctx:
            confirm_suggestion(sug.id, resolution=None, action=None, session=self.session)
        self.assertIn("Resolution is required", str(ctx.exception))

    def test_08_dismissal(self):
        """Test dismissing a suggestion."""
        suggestions = process_capture("Random task tomorrow", self.session)
        sug = suggestions[0]

        res = dismiss_suggestion(sug.id, session=self.session)
        self.assertEqual(res["status"], "dismissed")

        db_sug = self.session.get(Suggestion, sug.id)
        self.assertEqual(db_sug.status, "dismissed")

    def test_09_work_log_start_end_time(self):
        """Test creating and retrieving WorkLog with start_time and end_time."""
        today_str = datetime.now().strftime("%Y-%m-%d")
        w = WorkLog(
            title="Serviced printer in East Wing",
            category="IT Ops",
            date=today_str,
            location="East Wing",
            duration_hours=0.37,
            start_time="10:05 AM",
            end_time="10:27 AM",
            status="completed"
        )
        self.session.add(w)
        self.session.commit()

        log = self.session.get(WorkLog, w.id)
        self.assertEqual(log.start_time, "10:05 AM")
        self.assertEqual(log.end_time, "10:27 AM")
        self.assertEqual(log.duration_hours, 0.37)

if __name__ == "__main__":
    unittest.main()
