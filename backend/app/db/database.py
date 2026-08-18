import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load environment variables from .env in backend directory
backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv(dotenv_path=os.path.join(backend_dir, ".env"))

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./aivoa.db")

# Setup SQLAlchemy connection configuration with fallback resilience
engine = None
try:
    if DATABASE_URL.startswith("sqlite"):
        engine = create_engine(
            DATABASE_URL, connect_args={"check_same_thread": False}
        )
    else:
        # Verify connection to PostgreSQL/MySQL
        test_engine = create_engine(DATABASE_URL)
        conn = test_engine.connect()
        conn.close()
        engine = test_engine
        print(f"Database Connection Success: Connected to PostgreSQL database.", flush=True)
except Exception as e:
    # Print warnings for developer context and fallback to local SQLite
    print(f"Database Connection Warning: Failed to connect to {DATABASE_URL}. Details: {str(e)}", flush=True)
    print("Falling back to local SQLite database (sqlite:///./aivoa.db) for demo/robustness.", flush=True)
    DATABASE_URL = "sqlite:///./aivoa.db"
    engine = create_engine(
        DATABASE_URL, connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Dependency to get db session in FastAPI routes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
