import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from datetime import datetime, timedelta

from database import init_db, engine
from models import PlannedItem, WorkLog
from routers import capture, planned_items, work_logs

app = FastAPI(title="WorkPilot API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(capture.router)
app.include_router(planned_items.router)
app.include_router(work_logs.router)

@app.on_event("startup")
def on_startup():
    init_db()
    seed_demo_data()

@app.get("/api/v1/health")
def health_check():
    return {"status": "ok", "app": "WorkPilot API"}

def seed_demo_data():
    with Session(engine) as session:
        existing_planned = session.exec(select(PlannedItem)).first()
        existing_logs = session.exec(select(WorkLog)).first()

        if not existing_planned and not existing_logs:
            today_str = datetime.now().strftime("%Y-%m-%d")
            tomorrow_str = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")

            p1 = PlannedItem(
                title="Prepare laptops for MAP testing",
                category="Hardware",
                date=today_str,
                status="planned",
                source="manual"
            )
            p2 = PlannedItem(
                title="Check school printers",
                category="Maintenance",
                date=tomorrow_str,
                status="planned",
                source="manual"
            )

            w1 = WorkLog(
                title="Resolved core router connectivity issues in Building B",
                category="Infrastructure",
                date=today_str,
                duration_hours=2.5,
                status="completed",
                location="Building B Server Room"
            )
            w2 = WorkLog(
                title="Check backups",
                category="Maintenance",
                date=today_str,
                duration_hours=0.5,
                status="completed"
            )

            session.add_all([p1, p2, w1, w2])
            session.commit()

if __name__ == "__main__":
    import uvicorn
    import sys
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "127.0.0.1")
    if getattr(sys, "frozen", False):
        uvicorn.run(app, host=host, port=port)
    else:
        uvicorn.run("main:app", host=host, port=port, reload=False)
