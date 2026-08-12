"""나이 맞히기(Age Test) SQLAlchemy 모델.

Question 1 - N Option. 기존 database.py의 Base(공통 engine/session)를 그대로 재사용한다.
"""
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class Question(Base):
    __tablename__ = "age_test_questions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    # 질문 아래 작게 보여주는 보조 문구(기준 시점 안내 등). 없으면 null.
    subtitle: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # EXPERIENCE(강한 세대 신호) / ANCHOR(보정) / FUN(재미, 낮은 weight)
    type: Mapped[str] = mapped_column(String(20), nullable=False)
    # 이 질문이 나이 추정에서 갖는 초기 신호 강도.
    # MVP 휴리스틱 값(팀 내부 판단)이며 통계적으로 검증된 값이 아니다.
    weight: Mapped[float] = mapped_column(Float, nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, index=True)

    options: Mapped[list["Option"]] = relationship(
        back_populates="question", cascade="all, delete-orphan"
    )


class Option(Base):
    __tablename__ = "age_test_options"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    question_id: Mapped[int] = mapped_column(
        ForeignKey("age_test_questions.id"), nullable=False, index=True
    )
    text: Mapped[str] = mapped_column(String(255), nullable=False)
    # 이 선택지를 고를 만한 대표 나이. MVP 휴리스틱 값(팀 내부 판단).
    # 서버 내부(#5 나이 추정) 계산 전용 — 조회 API 응답에는 노출하지 않는다.
    representative_age: Mapped[int] = mapped_column(Integer, nullable=False)

    question: Mapped["Question"] = relationship(back_populates="options")


class Result(Base):
    """로그인 사용자의 나이맞히기 결과(#9). 서버가 #5에서 계산한 값만 저장한다 —
    클라이언트가 값을 직접 보내 저장을 요청하는 경로는 없다(위변조 방지)."""

    __tablename__ = "age_test_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    estimated_age: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
