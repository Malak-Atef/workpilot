import os
from sqlmodel import SQLModel, Session, create_engine

# Store DB locally in project, custom env location, or ~/.workpilot/
DB_DIR = os.environ.get("WORKPILOT_DB_DIR", os.path.expanduser("~/.workpilot"))
os.makedirs(DB_DIR, exist_ok=True)
DB_PATH = os.environ.get("WORKPILOT_DB_PATH", os.path.join(DB_DIR, "data.db"))

DATABASE_URL = os.environ.get("DATABASE_URL", f"sqlite:///{DB_PATH}")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False
)

def init_db():
    SQLModel.metadata.create_all(engine)
    with engine.connect() as conn:
        from sqlalchemy import text
        try:
            conn.execute(text("ALTER TABLE work_logs ADD COLUMN start_time VARCHAR;"))
            conn.commit()
        except Exception:
            pass
        try:
            conn.execute(text("ALTER TABLE work_logs ADD COLUMN end_time VARCHAR;"))
            conn.commit()
        except Exception:
            pass

def get_session():
    with Session(engine) as session:
        yield session
