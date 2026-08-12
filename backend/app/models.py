"""추억 놀이터 SQLAlchemy 모델.

Category (분야) 1 - N Content (콘텐츠) 1 - N ContentOption (선택지)
"""
from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Float,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    nickname: Mapped[str] = mapped_column(String(50), nullable=False)
    coin_balance: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class ChatMessage(Base):
    """세대별 챗봇 대화 저장 — #31. 로그인 사용자의 메시지만 여기 남는다.

    user 1개 메시지(role="user")와 그 응답(role="assistant")을 각각 한 행으로 저장한다.
    """

    __tablename__ = "chat_messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), nullable=False, index=True
    )
    generation: Mapped[str] = mapped_column(String(20), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False)  # "user" | "assistant"
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)

    user: Mapped["User"] = relationship()


class Feedback(Base):
    """로그인 사용자가 작성한 서비스 피드백."""

    __tablename__ = "feedbacks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), nullable=False, index=True
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship()


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    # COMEDY, DRAMA, MOVIE, ANIME_COMIC, STATIONERY_PLAY, MEME, FOOD, MUSIC
    code: Mapped[str] = mapped_column(String(30), unique=True, index=True, nullable=False)
    theme_color: Mapped[str] = mapped_column(String(20), nullable=True)
    icon: Mapped[str] = mapped_column(String(20), nullable=True)
    description: Mapped[str] = mapped_column(String(255), nullable=True)

    contents: Mapped[list["Content"]] = relationship(
        back_populates="category", cascade="all, delete-orphan"
    )


class Content(Base):
    __tablename__ = "contents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    category_id: Mapped[int] = mapped_column(
        ForeignKey("categories.id"), nullable=False, index=True
    )
    # 개그 하위분류: DAD / HUMANITIES / SCIENCE / GENERATION (그 외 분야는 NULL)
    subcategory: Mapped[str] = mapped_column(String(30), nullable=True, index=True)
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    question: Mapped[str] = mapped_column(Text, nullable=False)
    image_url: Mapped[str] = mapped_column(String(255), nullable=True)
    # QUIZ(객관식) / EXPERIENCE(경험 공유형) / TEXT_QUIZ(사진·노래 보고 텍스트로 정답 입력)
    content_type: Mapped[str] = mapped_column(String(20), default="QUIZ")
    # TEXT_QUIZ 정답(텍스트). 여러 정답 허용 시 '|'로 구분한다. (객관식은 NULL)
    answer: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    category: Mapped["Category"] = relationship(back_populates="contents")
    options: Mapped[list["ContentOption"]] = relationship(
        back_populates="content", cascade="all, delete-orphan"
    )


class ContentOption(Base):
    __tablename__ = "content_options"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    content_id: Mapped[int] = mapped_column(
        ForeignKey("contents.id"), nullable=False, index=True
    )
    option_text: Mapped[str] = mapped_column(String(255), nullable=False)
    is_correct: Mapped[bool] = mapped_column(Boolean, default=False)

    content: Mapped["Content"] = relationship(back_populates="options")


class CoinTransaction(Base):
    __tablename__ = "coin_transactions"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    amount: Mapped[int] = mapped_column(Integer, nullable=False)
    reason: Mapped[str] = mapped_column(String(50), nullable=False)
    event_key: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class RankingQuestion(Base):
    __tablename__ = "ranking_questions"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    content_id: Mapped[int] = mapped_column(ForeignKey("contents.id"), unique=True, nullable=False, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    content: Mapped["Content"] = relationship()


class RankingChallenge(Base):
    __tablename__ = "ranking_challenges"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    submitted_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="ACTIVE", nullable=False)
    coin_cost: Mapped[int] = mapped_column(Integer, default=10, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class RankingChallengeItem(Base):
    __tablename__ = "ranking_challenge_items"
    __table_args__ = (UniqueConstraint("challenge_id", "ranking_question_id"), UniqueConstraint("challenge_id", "position"))
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    challenge_id: Mapped[int] = mapped_column(ForeignKey("ranking_challenges.id"), nullable=False, index=True)
    ranking_question_id: Mapped[int] = mapped_column(ForeignKey("ranking_questions.id"), nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    ranking_question: Mapped["RankingQuestion"] = relationship()


class RankingRecord(Base):
    __tablename__ = "ranking_records"
    __table_args__ = (UniqueConstraint("user_id", "official_date"),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    challenge_id: Mapped[int] = mapped_column(ForeignKey("ranking_challenges.id"), unique=True, nullable=False)
    correct_count: Mapped[int] = mapped_column(Integer, nullable=False)
    total_count: Mapped[int] = mapped_column(Integer, default=20, nullable=False)
    accuracy: Mapped[float] = mapped_column(Float, nullable=False)
    elapsed_seconds: Mapped[int] = mapped_column(Integer, nullable=False)
    official_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
