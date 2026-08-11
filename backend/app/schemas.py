"""Pydantic 스키마 (요청/응답 DTO)."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


# ---------- Category ----------
class CategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    code: str
    theme_color: Optional[str] = None
    icon: Optional[str] = None
    description: Optional[str] = None


# ---------- ContentOption ----------
class ContentOptionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    option_text: str
    # 정답 노출 방지를 위해 목록/단건 조회 응답에서는 is_correct 를 내려주지 않는다.


# ---------- Content ----------
class ContentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    category_id: int
    subcategory: Optional[str] = None
    title: str
    question: str
    image_url: Optional[str] = None
    content_type: str
    created_at: datetime
    options: list[ContentOptionOut] = []


# ---------- Answer ----------
class AnswerIn(BaseModel):
    option_id: int


class AnswerOut(BaseModel):
    content_id: int
    selected_option_id: int
    is_correct: bool
    correct_option_id: Optional[int] = None
    correct_option_text: Optional[str] = None
    message: str


# ---------- Generation (세대별 챗봇, 3번 담당) ----------
class GenerationOut(BaseModel):
    id: str
    display_name: str
    character: str


# ---------- 아재력 결과 처리 ----------
class ResultIn(BaseModel):
    correct: int          # 맞힌 QUIZ 개수
    total: int            # 푼 QUIZ 개수
    category: Optional[str] = None  # 분야 코드 (선택)


class ResultOut(BaseModel):
    correct: int
    total: int
    score: int            # 0~100 점수(정답률)
    level: str            # 아재력 등급 라벨
    message: str          # 결과 멘트
    category: Optional[str] = None
