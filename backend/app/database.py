"""데이터베이스 연결 설정.

DATABASE_URL 환경변수로 DB를 제어한다.
- 기본값: SQLite (로컬 개발용, 별도 설치 불필요)
- 팀 표준: MySQL (mysql+pymysql://... 형식으로 교체)
"""
import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./memory_playground.db")

# SQLite 는 멀티스레드 접근을 위해 check_same_thread=False 필요
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, echo=False, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI 의존성: 요청마다 DB 세션을 열고 닫는다."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
