"""나이 맞히기(Age Test) SQLAlchemy 모델.

Question 1 - N Option. 기존 database.py의 Base(공통 engine/session)를 그대로 재사용한다.
"""
from sqlalchemy import Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class Question(Base):
    __tablename__ = "age_test_questions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    # EXPERIENCE(경험형 7문항) / ANCHOR(기준점형 3문항)
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
