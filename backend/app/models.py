"""추억 놀이터 SQLAlchemy 모델.

Category (분야) 1 - N Content (콘텐츠) 1 - N ContentOption (선택지)
"""
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
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
