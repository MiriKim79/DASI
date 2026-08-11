"""Pydantic 스키마 (요청/응답 DTO)."""
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


# ---------- Auth / User ----------
class SignupIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    nickname: str = Field(min_length=1, max_length=50)

    @field_validator("nickname")
    @classmethod
    def nickname_must_not_be_blank(cls, value: str) -> str:
        nickname = value.strip()
        if not nickname:
            raise ValueError("닉네임을 입력해주세요.")
        return nickname


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    nickname: str
    coin_balance: int
    created_at: datetime


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"


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


# ---------- Answer (객관식) ----------
class AnswerIn(BaseModel):
    option_id: int


# ---------- Answer (텍스트 입력형: 사진/노래 보고 정답 작성) ----------
class TextAnswerIn(BaseModel):
    text: str


class TextAnswerOut(BaseModel):
    content_id: int
    is_correct: bool
    correct_answer: Optional[str] = None
    message: str


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


# ---------- Chat (세대별 챗봇, 3번 담당) ----------
class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class ChatIn(BaseModel):
    generation: str
    message: str
    history: list[ChatMessage] = []


class ChatOut(BaseModel):
    generation: str
    character: str
    message: str


# ---------- 개그 콘텐츠 + 퀴즈 (F3-4, 3번 담당) ----------
class GagItemOut(BaseModel):
    id: int
    prompt: str
    # 정답은 조회 응답에 포함하지 않는다 (채점 API에서만 공개)


class GagAnswerIn(BaseModel):
    answer: str


class GagAnswerOut(BaseModel):
    item_id: int
    is_correct: bool
    correct_answer: str


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
